import { Octokit } from "octokit";

// Extract image URLs from PR conversation comments for the dashboard carousel.
// Bot comments are skipped and Linear-hosted attachment URLs are dropped:
// linear-code[bot] posts a "<!-- linear-linkback -->" comment on every PR
// linked to a Linear ticket, quoting the ticket description — including the
// ticket's problem screenshots (uploads.linear.app/...). Those describe the
// original problem, not the fix, so they must not surface as PR images.
export function extractImagesFromComments(comments) {
  const isBotComment = (comment) =>
    comment?.user?.type === "Bot" ||
    (comment?.user?.login || "").endsWith("[bot]");

  const extractImageUrls = (text) => {
    if (!text) return [];

    const urls = [];

    // Extract Markdown images: ![alt](url)
    const markdownImages = text.match(/!\[.*?\]\((.*?)\)/g) || [];
    markdownImages.forEach((img) => {
      const url = img.match(/!\[.*?\]\((.*?)\)/)[1];
      if (url) urls.push(url);
    });

    // Extract HTML img tags with double quotes: <img src="url">
    const htmlImagesDouble = text.match(/<img[^>]+src="([^"]*)"/g) || [];
    htmlImagesDouble.forEach((img) => {
      const url = img.match(/src="([^"]*)"/)[1];
      if (url) urls.push(url);
    });

    // Extract HTML img tags with single quotes: <img src='url'>
    const htmlImagesSingle = text.match(/<img[^>]+src='([^']*)'/g) || [];
    htmlImagesSingle.forEach((img) => {
      const url = img.match(/src='([^']*)'/)[1];
      if (url) urls.push(url);
    });

    // Extract direct GitHub asset URLs and other image URLs
    const directUrls = text.match(/https?:\/\/[^\s)]+\.(?:png|jpg|jpeg|gif|webp|svg)(?:\?[^\s)]*)?/gi) || [];
    directUrls.forEach((url) => urls.push(url));

    // Extract GitHub user-attachments URLs (common for drag-drop images)
    const githubAssets = text.match(/https?:\/\/github\.com\/[^\/]+\/[^\/]+\/assets\/[^\s)]+/gi) || [];
    githubAssets.forEach((url) => urls.push(url));

    return urls;
  };

  const imageUrls = new Set();
  (comments || []).forEach((comment) => {
    if (isBotComment(comment)) return;
    extractImageUrls(comment.body).forEach((url) => imageUrls.add(url));
  });

  // Linear-hosted attachments always show the ticket's problem screenshots —
  // dropped even when pasted by a human (e.g. quoting the bot linkback).
  return Array.from(imageUrls).filter(
    (url) => !url.includes("uploads.linear.app"),
  );
}

export class GitHubApiClient {
  constructor(token) {
    this.token = token;
    this.client = new Octokit({ auth: token });
  }

  async fetchImageAsBase64(imageUrl) {
    try {
      const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(imageUrl)}&token=${this.token}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error fetching image:", error);
      return null;
    }
  }

  async getPullRequests(owner, repo, fromDate, toDate) {
    const prs = await this.getAllPages(
      this.client.rest.pulls.list.bind(this.client.rest.pulls),
      {
        owner,
        repo,
        state: "closed",
        sort: "updated",
        direction: "desc",
      },
    );

    // Filter PRs closed within date range
    const filteredPRs = prs.filter((pr) => {
      const closedAt = new Date(pr.closed_at);
      return closedAt >= fromDate && closedAt <= toDate;
    });

    // Fetch comments and review comments for filtered PRs
    const prsWithImages = await Promise.all(
      filteredPRs.map(async (pr) => {
        const comments = await this.getAllPages(
          this.client.rest.issues.listComments.bind(this.client.rest.issues),
          {
            owner,
            repo,
            issue_number: pr.number,
          },
        );

        // Extract image URLs from PR conversation comments only (bots excluded
        // and Linear-hosted attachments dropped — see extractImagesFromComments)
        const imageUrls = extractImagesFromComments(comments);

        // Fetch and convert images to base64
        const imageBase64Array = await Promise.all(
          Array.from(imageUrls).map(url => this.fetchImageAsBase64(url))
        );

        // Filter out any failed image fetches
        const images = imageBase64Array.filter(Boolean);

        return {
          ...pr,
          images,
        };
      }),
    );

    return prsWithImages;
  }

  async getAllPages(method, params) {
    const results = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await method({
        ...params,
        per_page: 100,
        page,
      });

      results.push(...response.data);
      hasMore = response.data.length === 100;
      page++;
    }

    return results;
  }

  async getMembers(org) {
    return this.getAllPages(
      this.client.rest.orgs.listMembers.bind(this.client.rest.orgs),
      {
        org,
        role: "all",
      },
    );
  }

  async getRepos(org) {
    return this.getAllPages(
      this.client.rest.repos.listForOrg.bind(this.client.rest.repos),
      {
        org,
        type: "all",
      },
    );
  }

  async getContributorStats(owner, repo) {
    try {
      const response = await this.client.rest.repos.getContributorsStats({
        owner,
        repo,
      });
      return response.data;
    } catch (error) {
      console.warn(`Failed to get contributor stats for ${repo}:`, error);
      return null;
    }
  }

  async getIssues(owner, repo, since) {
    return this.getAllPages(
      this.client.rest.issues.listForRepo.bind(this.client.rest.issues),
      {
        owner,
        repo,
        since,
        state: "all",
        sort: "created",
        direction: "desc",
      },
    );
  }

  async getCurrentOpenIssues(owner, repo) {
    return this.getAllPages(
      this.client.rest.issues.listForRepo.bind(this.client.rest.issues),
      {
        owner,
        repo,
        state: "open",
      },
    );
  }
}
