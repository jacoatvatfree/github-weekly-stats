export const createGitHubIssueAdapter = (dependencies) => {
  const { apiClient } = dependencies;
  
  const getIssues = async (repoInfo, fromDate, toDate) => {
    const { owner, repo } = repoInfo;
    const issues = await apiClient.getIssues(owner, repo, fromDate.toISOString());
    return issues
      .filter(issue => !issue.pull_request)
      .map(transformToStandardFormat);
  };
  
  const getCurrentOpenIssues = async (repoInfo) => {
    const { owner, repo } = repoInfo;
    const issues = await apiClient.getCurrentOpenIssues(owner, repo);
    return issues
      .filter(issue => !issue.pull_request)
      .map(transformToStandardFormat);
  };
  
  const transformToStandardFormat = (githubIssue) => ({
    id: githubIssue.id,
    title: githubIssue.title,
    state: githubIssue.state,
    createdAt: githubIssue.created_at,
    closedAt: githubIssue.closed_at,
    labels: githubIssue.labels?.map(l => l.name) || [],
    assignee: githubIssue.assignee?.login,
    url: githubIssue.html_url,
    source: 'github'
  });
  
  const validateConfig = () => true;
  
  return {
    getIssues,
    getCurrentOpenIssues,
    transformToStandardFormat,
    validateConfig
  };
};