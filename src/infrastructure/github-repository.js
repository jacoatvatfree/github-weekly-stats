import { GitHubApiClient } from "./github/api-client";
import { CacheManager } from "./github/cache-manager";
import { StatsCalculator } from "./github/stats-calculator";
import { createIssueAdapter } from "./adapters/adapter-factory.js";
import { createMultiSourceIssueService } from "./multi-source-issue-service.js";

export class GithubRepository {
  constructor(token, externalConfig = null, httpClient = fetch) {
    this.api = new GitHubApiClient(token);
    this.cache = new CacheManager();
    this.externalConfig = externalConfig;
    
    // Initialize adapters with dependency injection
    const githubAdapter = createIssueAdapter({
      config: { enabled: false },
      apiClient: this.api
    });
    
    const externalAdapter = externalConfig?.enabled 
      ? createIssueAdapter({
          config: externalConfig,
          httpClient,
          apiClient: this.api
        })
      : null;
    
    this.issueService = createMultiSourceIssueService({
      githubAdapter,
      externalAdapter,
      config: { ...externalConfig, defaultOwner: null }
    });
  }

  async getOrganization(orgName, dateRange, onProgress) {
    const cacheKey = `${orgName}-${dateRange.fromDate}-${dateRange.toDate}`;
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const fromDate = new Date(dateRange.fromDate);
    const toDate = new Date(dateRange.toDate);
    const toDatePlusOne = new Date(toDate);
    toDatePlusOne.setDate(toDate.getDate() + 1);

    // Get all data in parallel
    const [members, allRepos] = await Promise.all([
      this.api.getMembers(orgName),
      this.api.getRepos(orgName),
    ]);

    // Filter non-forked repos
    const ownRepos = allRepos.filter((repo) => !repo.fork);

    let processed = 0;
    const totalRepos = ownRepos.length;

    // Check if Linear is enabled - if so, fetch Linear data once for the organization
    let organizationLinearIssues = [];
    let organizationLinearOpenIssues = [];
    
    if (this.issueService.isExternalEnabled() && this.issueService.getExternalProvider() === 'linear') {
      console.log('Linear is enabled - fetching organization-wide issue data...');
      try {
        const externalAdapter = this.issueService.externalAdapter;
        if (externalAdapter) {
          [organizationLinearIssues, organizationLinearOpenIssues] = await Promise.all([
            externalAdapter.getIssues(null, fromDate, toDatePlusOne),
            externalAdapter.getCurrentOpenIssues(null),
          ]);
          console.log(`Fetched ${organizationLinearIssues.length} Linear issues and ${organizationLinearOpenIssues.length} open issues`);
        }
      } catch (error) {
        console.warn('Failed to fetch Linear data, falling back to GitHub:', error);
      }
    }

    // Get stats for all repos in parallel
    const repoStats = await Promise.all(
      ownRepos.map(async (repo) => {
        try {
          const [contributorStats, pullRequests] = await Promise.all([
            this.api.getContributorStats(orgName, repo.name),
            this.api.getPullRequests(orgName, repo.name, fromDate, toDatePlusOne),
          ]);

          // Use multi-source issue service for issue retrieval
          let issues, currentOpenIssues;
          
          if (this.issueService.isExternalEnabled() && this.issueService.getExternalProvider() === 'linear') {
            // When Linear is enabled, only the first repository gets the organization-wide issues
            // This prevents duplication across all repositories
            if (processed === 0) {
              issues = organizationLinearIssues;
              currentOpenIssues = organizationLinearOpenIssues;
            } else {
              // Other repositories get empty issue arrays to avoid duplication
              issues = [];
              currentOpenIssues = [];
            }
          } else {
            // Use GitHub issues for this specific repository
            const repoIdentifier = `${orgName}/${repo.name}`;
            [issues, currentOpenIssues] = await Promise.all([
              this.issueService.getIssuesForRepo(repoIdentifier, fromDate, toDatePlusOne),
              this.issueService.getCurrentOpenIssuesForRepo(repoIdentifier),
            ]);
          }

          // Filter issues by date range (since multi-source may return more than requested)
          const filteredIssues = issues.filter((item) => {
            const createdAt = new Date(item.createdAt);
            return createdAt >= fromDate && createdAt < toDatePlusOne;
          });

          const filteredPRs = pullRequests.filter((item) => {
            const createdAt = new Date(item.created_at);
            return createdAt >= fromDate && createdAt < toDatePlusOne;
          });
          const closedPRsTitles = filteredPRs
            .filter((pr) => pr.state === "closed")
            .map((pr) => ({ 
              id: pr.id, 
              title: pr.title, 
              repo: `${orgName}/${repo.name}`,
              number: pr.number || pr.id
            }));

          processed++;
          if (onProgress) {
            onProgress(processed, totalRepos);
          }

          return {
            name: repo.name,
            stars: repo.stargazers_count,
            contributorStats,
            issues: {
              opened: filteredIssues.length,
              closed: filteredIssues.filter((item) => item.state === "closed").length,
              closedIssues: filteredIssues
                .filter((item) => item.state === "closed")
                .map((item) => ({ id: item.id, title: item.title })),
              dailyStats: StatsCalculator.calculateDailyIssueStats(
                filteredIssues,
                fromDate,
                toDatePlusOne,
                currentOpenIssues.length,
              ),
            },
            pullRequests: {
              opened: filteredPRs.length,
              closed: filteredPRs.filter((pr) => pr.state === "closed").length,
              types: StatsCalculator.categorizePRTypes(filteredPRs),
              all: pullRequests, // Add the full PR data including images
            },
            closedPRsTitles: closedPRsTitles,
            createdAt: repo.created_at,
            archivedAt: repo.archived_at,
          };
        } catch (error) {
          console.warn(`Failed to get stats for ${repo.name}:`, error);
          processed++;
          if (onProgress) {
            onProgress(processed, totalRepos);
          }
          return null;
        }
      }),
    ).then((results) => results.filter(Boolean));

    // Calculate member contributions within date range
    const memberStats = {};
    repoStats.forEach((repo) => {
      // Ensure contributorStats is an array before processing
      const stats = Array.isArray(repo.contributorStats)
        ? repo.contributorStats
        : [];
      stats.forEach((contributor) => {
        const login = contributor?.author?.login;
        if (login && Array.isArray(contributor.weeks)) {
          const filteredCommits = contributor.weeks
            .filter((week) => {
              const weekDate = new Date(week.w * 1000);
              return weekDate >= fromDate && weekDate < toDatePlusOne;
            })
            .reduce((sum, week) => sum + (week.c || 0), 0);
          memberStats[login] = (memberStats[login] || 0) + filteredCommits;
        }
      });
    });

    const enhancedMembers = members.map((member) => ({
      ...member,
      contributions: memberStats[member.login] || 0,
    }));

    // Collect all pull requests with images across all repos
    const allPullRequests = repoStats.reduce((acc, repo) => {
      if (repo.pullRequests?.all) {
        return [...acc, ...repo.pullRequests.all];
      }
      return acc;
    }, []);

    const result = {
      repos: repoStats.map(({ name, stars, contributorStats, issues, closedPRsTitles }) => ({
        name,
        stars,
        contributors: contributorStats?.length || 0,
        closedIssues: issues.closed || 0,
        commitCount: Array.isArray(contributorStats)
          ? contributorStats.reduce((sum, contributor) => {
              if (!Array.isArray(contributor?.weeks)) return sum;
              return (
                sum +
                contributor.weeks
                  .filter((week) => {
                    const weekDate = new Date(week.w * 1000);
                    weekDate.setDate(weekDate.getDate() + 6); // Consider full week
                    return weekDate >= fromDate && weekDate < toDatePlusOne;
                  })
                  .reduce((weekSum, week) => weekSum + (week.c || 0), 0)
              );
            }, 0)
          : 0,
        closedIssuesTitles: issues.closedIssues,
        closedPRsTitles: closedPRsTitles,
      })),
      members: enhancedMembers,
      yearlyStats: StatsCalculator.calculateYearlyStats(
        repoStats,
        fromDate,
        toDatePlusOne,
      ),
      dailyIssueStats: repoStats.reduce((acc, repo) => {
        if (!repo.issues.dailyStats) return acc;

        repo.issues.dailyStats.forEach((day, index) => {
          if (!acc[index]) {
            acc[index] = { opened: 0, closed: 0, total: 0 };
          }
          acc[index].opened += day.opened;
          acc[index].closed += day.closed;
          acc[index].total += day.total;
        });
        return acc;
      }, []),
      pullRequests: allPullRequests, // Add all pull requests to the result
    };

    // Save the fresh data to cache
    this.cache.save(cacheKey, result);

    return result;
  }

  // Methods for managing external issue sources
  getIssueSourceForRepo(repoName) {
    return this.issueService.getIssueSourceForRepo(repoName);
  }

  isExternalEnabled() {
    return this.issueService.isExternalEnabled();
  }

  getExternalProvider() {
    return this.issueService.getExternalProvider();
  }

  updateExternalConfig(newConfig) {
    this.externalConfig = newConfig;
    
    // Recreate adapters with new config
    const githubAdapter = createIssueAdapter({
      config: { enabled: false },
      apiClient: this.api
    });
    
    const externalAdapter = newConfig?.enabled 
      ? createIssueAdapter({
          config: newConfig,
          httpClient: fetch,
          apiClient: this.api
        })
      : null;
    
    this.issueService = createMultiSourceIssueService({
      githubAdapter,
      externalAdapter,
      config: { ...newConfig, defaultOwner: null }
    });
  }
}
