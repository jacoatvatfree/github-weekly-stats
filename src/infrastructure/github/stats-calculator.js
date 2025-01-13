export class StatsCalculator {
  static calculateDailyIssueStats(
    issues,
    fromDate,
    toDate,
    currentOpenIssueCount,
  ) {
    // Calculate number of days between dates
    const dayDiff = Math.floor((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;

    const dailyStats = Array(dayDiff)
      .fill()
      .map(() => ({
        opened: 0,
        closed: 0,
        total: 0,
      }));

    // Count issues that were already open before the start date
    const preExistingOpenIssues = issues.filter((issue) => {
      const createdDate = new Date(issue.created_at);
      const closedDate = issue.closed_at ? new Date(issue.closed_at) : null;
      return createdDate < fromDate && (!closedDate || closedDate >= fromDate);
    }).length;

    const sortedIssues = [...issues].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at),
    );

    let runningTotal = preExistingOpenIssues; // Start with pre-existing open issues

    sortedIssues.forEach((issue) => {
      const createdDate = new Date(issue.created_at);
      const closedDate = issue.closed_at ? new Date(issue.closed_at) : null;

      if (createdDate >= fromDate && createdDate <= toDate) {
        const dayIndex = Math.floor(
          (createdDate - fromDate) / (1000 * 60 * 60 * 24),
        );
        if (dayIndex >= 0 && dayIndex < dailyStats.length) {
          dailyStats[dayIndex].opened++;
          runningTotal++;
        }
      }

      if (closedDate && closedDate >= fromDate && closedDate <= toDate) {
        const dayIndex = Math.floor(
          (closedDate - fromDate) / (1000 * 60 * 60 * 24),
        );
        if (dayIndex >= 0 && dayIndex < dailyStats.length) {
          dailyStats[dayIndex].closed++;
          runningTotal--;
        }
      }
    });

    // Set initial total and calculate cumulative totals
    let currentTotal = preExistingOpenIssues;
    for (let i = 0; i < dailyStats.length; i++) {
      currentTotal = currentTotal + dailyStats[i].opened - dailyStats[i].closed;
      dailyStats[i].total = currentTotal;
    }

    // Adjust the final total if needed
    const padding =
      currentOpenIssueCount - dailyStats[dailyStats.length - 1].total;

    dailyStats.forEach((stat) => {
      stat.total += padding;
    });

    return dailyStats;
  }

  static categorizePRTypes(prs) {
    const types = {};

    const closedPRs = prs.filter((pr) => pr.state === "closed");

    closedPRs.forEach((pr) => {
      if (pr.head?.ref) {
        const type = pr.head.ref.includes("/")
          ? pr.head.ref.split("/")[0].toLowerCase()
          : "unknown";

        types[type] = (types[type] || 0) + 1;
      } else {
        types["unknown"] = (types["unknown"] || 0) + 1;
      }
    });

    return types;
  }

  static calculateYearlyStats(repoStats, fromDate, toDate) {
    return {
      repositories: {
        created: repoStats.filter((repo) => {
          const createdAt = new Date(repo.createdAt);
          return createdAt >= fromDate && createdAt <= toDate;
        }).length,
        archived: repoStats.filter(
          (repo) =>
            repo.archivedAt &&
            new Date(repo.archivedAt) >= fromDate &&
            new Date(repo.archivedAt) <= toDate,
        ).length,
      },
      commits: repoStats.reduce((sum, repo) => {
        if (!repo.contributorStats) return sum;

        const repoCommits = repo.contributorStats.reduce(
          (repoSum, contributor) => {
            if (!contributor.weeks) return repoSum;

            const weekCommits = contributor.weeks.reduce((weekSum, week) => {
              const weekDate = new Date(week.w * 1000);
              if (weekDate >= fromDate && weekDate <= toDate) {
                return weekSum + (week.c || 0);
              }
              return weekSum;
            }, 0);

            return repoSum + weekCommits;
          },
          0,
        );

        return sum + repoCommits;
      }, 0),
      issues: {
        opened: repoStats.reduce((sum, repo) => sum + repo.issues.opened, 0),
        closed: repoStats.reduce((sum, repo) => sum + repo.issues.closed, 0),
      },
      pullRequests: {
        opened: repoStats.reduce(
          (sum, repo) => sum + repo.pullRequests.opened,
          0,
        ),
        closed: repoStats.reduce(
          (sum, repo) => sum + repo.pullRequests.closed,
          0,
        ),
        types: repoStats.reduce((types, repo) => {
          Object.entries(repo.pullRequests.types).forEach(([type, count]) => {
            types[type] = (types[type] || 0) + count;
          });
          return types;
        }, {}),
      },
    };
  }
}
