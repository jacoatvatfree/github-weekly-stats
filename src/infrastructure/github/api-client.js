import { Octokit } from "octokit";

export class GitHubApiClient {
  constructor(token) {
    this.client = new Octokit({ auth: token });
  }

  async getAllPages(method, params) {
    let allData = [];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      const response = await method({ ...params, page, per_page: 100 });
      allData = [...allData, ...response.data];

      const linkHeader = response.headers.link;
      hasNextPage = linkHeader && linkHeader.includes('rel="next"');
      page++;
    }

    return allData;
  }

  async getMembers(orgName) {
    return await this.getAllPages(
      this.client.rest.orgs.listMembers.bind(this.client.rest.orgs),
      { org: orgName },
    );
  }

  async getRepos(orgName) {
    return await this.getAllPages(
      this.client.rest.repos.listForOrg.bind(this.client.rest.repos),
      {
        org: orgName,
        sort: "updated",
        type: "all",
      },
    );
  }

  async getIssues(owner, repo, since) {
    return await this.getAllPages(
      this.client.rest.issues.listForRepo.bind(this.client.rest.issues),
      {
        owner,
        repo,
        state: "all",
        since,
      },
    );
  }

  async getPullRequests(owner, repo) {
    const prs = await this.getAllPages(
      this.client.rest.pulls.list.bind(this.client.rest.pulls),
      {
        owner,
        repo,
        state: "closed",
        sort: "created",
        direction: "desc",
      },
    );

    // Fetch comments and review comments for each PR to find images
    const prsWithImages = await Promise.all(
      prs.map(async (pr) => {
        const [comments, reviewComments] = await Promise.all([
          this.getAllPages(
            this.client.rest.issues.listComments.bind(this.client.rest.issues),
            {
              owner,
              repo,
              issue_number: pr.number,
            }
          ),
          this.getAllPages(
            this.client.rest.pulls.listReviewComments.bind(this.client.rest.pulls),
            {
              owner,
              repo,
              pull_number: pr.number,
            }
          )
        ]);

        // Extract image URLs from PR body and comments
        const imageUrls = new Set();
        
        // Check PR body
        const bodyImages = pr.body?.match(/!\[.*?\]\((.*?)\)/g)?.map(img => 
          img.match(/!\[.*?\]\((.*?)\)/)[1]
        ) || [];
        bodyImages.forEach(url => imageUrls.add(url));

        // Check comments
        comments.forEach(comment => {
          const matches = comment.body?.match(/!\[.*?\]\((.*?)\)/g)?.map(img => 
            img.match(/!\[.*?\]\((.*?)\)/)[1]
          ) || [];
          matches.forEach(url => imageUrls.add(url));
        });

        // Check review comments
        reviewComments.forEach(comment => {
          const matches = comment.body?.match(/!\[.*?\]\((.*?)\)/g)?.map(img => 
            img.match(/!\[.*?\]\((.*?)\)/)[1]
          ) || [];
          matches.forEach(url => imageUrls.add(url));
        });

        return {
          ...pr,
          images: Array.from(imageUrls)
        };
      })
    );

    return prsWithImages;
  }

  async getCurrentOpenIssues(owner, repo) {
    try {
      const issues = await this.getAllPages(
        this.client.rest.issues.listForRepo.bind(this.client.rest.issues),
        {
          owner,
          repo,
          state: "open",
        },
      );

      // Filter out pull requests
      return issues.filter((issue) => !issue.pull_request);
    } catch (error) {
      console.warn(`Failed to get open issues for ${repo}:`, error);
      return [];
    }
  }

  async getContributorStats(owner, repo, retries = 3) {
    try {
      const response = await this.client.rest.repos.getContributorsStats({
        owner,
        repo,
      });

      // If status is 202, GitHub is still calculating the stats
      if (response.status === 202 && retries > 0) {
        // Wait for 1 second before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return this.getContributorStats(owner, repo, retries - 1);
      }

      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.warn(`Failed to get contributor stats for ${repo}:`, error);
      return [];
    }
  }
}
