import { createGitHubIssueAdapter } from './github-issue-adapter.js';
import { createLinearIssueAdapter } from './linear-issue-adapter.js';

export const createIssueAdapter = (dependencies) => {
  const { config, apiClient, httpClient } = dependencies;
  
  if (!config?.enabled) {
    return createGitHubIssueAdapter({ apiClient });
  }
  
  switch (config.provider) {
    case 'linear':
      return createLinearIssueAdapter({ httpClient, config });
    case 'github':
      return createGitHubIssueAdapter({ apiClient });
    default:
      throw new Error(`Unsupported adapter type: ${config.provider}`);
  }
};