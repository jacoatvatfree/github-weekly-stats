import { Octokit } from "octokit";

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
        const [comments, reviewComments] = await Promise.all([
          this.getAllPages(
            this.client.rest.issues.listComments.bind(this.client.rest.issues),
            {
              owner,
              repo,
              issue_number: pr.number,
            },
          ),
          this.getAllPages(
            this.client.rest.pulls.listReviewComments.bind(
              this.client.rest.pulls,
            ),
            {
              owner,
              repo,
              pull_number: pr.number,
            },
          ),
        ]);

        // Extract image URLs from PR body and comments
        const imageUrls = new Set();

        // Check PR body
        const bodyImages =
          pr.body
            ?.match(/!\[.*?\]\((.*?)\)/g)
            ?.map((img) => img.match(/!\[.*?\]\((.*?)\)/)[1]) || [];
        bodyImages.forEach((url) => imageUrls.add(url));

        // Check comments
        comments.forEach((comment) => {
          const matches =
            comment.body
              ?.match(/!\[.*?\]\((.*?)\)/g)
              ?.map((img) => img.match(/!\[.*?\]\((.*?)\)/)[1]) || [];
          matches.forEach((url) => imageUrls.add(url));
        });

        // Check review comments
        reviewComments.forEach((comment) => {
          const matches =
            comment.body
              ?.match(/!\[.*?\]\((.*?)\)/g)
              ?.map((img) => img.match(/!\[.*?\]\((.*?)\)/)[1]) || [];
          matches.forEach((url) => imageUrls.add(url));
        });

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
