export const createMultiSourceIssueService = (dependencies) => {
  const { githubAdapter, externalAdapter, config } = dependencies;
  
  const getIssuesForRepo = async (repoName, fromDate, toDate) => {
    // This method should not be called when Linear is enabled
    // Linear data is handled at the organization level
    if (config?.enabled && config?.provider === 'linear' && externalAdapter) {
      console.warn('getIssuesForRepo called with Linear enabled - this should not happen');
      return [];
    }
    
    // Use GitHub for this specific repo
    const [owner, repo] = parseRepoName(repoName);
    return await githubAdapter.getIssues({ owner, repo }, fromDate, toDate);
  };
  
  const getCurrentOpenIssuesForRepo = async (repoName) => {
    // This method should not be called when Linear is enabled
    // Linear data is handled at the organization level
    if (config?.enabled && config?.provider === 'linear' && externalAdapter) {
      console.warn('getCurrentOpenIssuesForRepo called with Linear enabled - this should not happen');
      return [];
    }
    
    // Use GitHub for this specific repo
    const [owner, repo] = parseRepoName(repoName);
    return await githubAdapter.getCurrentOpenIssues({ owner, repo });
  };
  
  const getIssueSourceForRepo = (repoName) => {
    return config?.enabled ? config.provider : 'github';
  };
  
  const parseRepoName = (repoName) => {
    if (repoName.includes('/')) {
      return repoName.split('/');
    }
    
    if (config?.defaultOwner) {
      return [config.defaultOwner, repoName];
    }
    
    throw new Error(`Cannot parse repository name: ${repoName}. Please provide owner/repo format or configure defaultOwner.`);
  };
  
  const isExternalEnabled = () => {
    return config?.enabled || false;
  };
  
  const getExternalProvider = () => {
    return config?.provider || null;
  };
  
  return {
    getIssuesForRepo,
    getCurrentOpenIssuesForRepo,
    getIssueSourceForRepo,
    isExternalEnabled,
    getExternalProvider,
    externalAdapter // Expose the external adapter
  };
};