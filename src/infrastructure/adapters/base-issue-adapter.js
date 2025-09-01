export const createBaseIssueAdapter = () => ({
  getIssues: async (identifier, fromDate, toDate) => {
    throw new Error('getIssues must be implemented');
  },
  getCurrentOpenIssues: async (identifier) => {
    throw new Error('getCurrentOpenIssues must be implemented');
  },
  transformToStandardFormat: (rawIssue) => {
    throw new Error('transformToStandardFormat must be implemented');
  },
  validateConfig: (config) => {
    throw new Error('validateConfig must be implemented');
  }
});