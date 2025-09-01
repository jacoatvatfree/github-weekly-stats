export const createLinearIssueAdapter = (dependencies) => {
  const { httpClient, config } = dependencies;
  const { apiKey } = config.credentials;
  
  const makeLinearRequest = async (query, variables = {}) => {
    const response = await httpClient('/api/linear-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        variables,
        apiKey
      })
    });
    
    if (!response.ok) {
      throw new Error(`Linear API proxy error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.errors) {
      throw new Error(`Linear GraphQL error: ${data.errors[0].message}`);
    }
    
    return data;
  };
  
  const getAllTeams = async () => {
    const query = `
      query {
        teams {
          nodes {
            id
            name
          }
        }
      }
    `;
    
    try {
      const data = await makeLinearRequest(query);
      return data.data.teams.nodes;
    } catch (error) {
      console.warn('Failed to fetch teams, falling back to empty list:', error.message);
      // If we can't get teams at all, return empty array
      return [];
    }
  };
  
  const getIssues = async (identifier, fromDate, toDate) => {
    // Get all teams and aggregate issues across them
    const teams = await getAllTeams();
    
    const allIssues = await Promise.all(
      teams.map(async (team) => {
        const allIssuesForTeam = [];
        let hasNextPage = true;
        let cursor = null;
        
        while (hasNextPage) {
          const query = `
            query($teamId: ID!, $after: DateTimeOrDuration!, $before: DateTimeOrDuration!, $cursor: String) {
              issues(
                filter: {
                  team: { id: { eq: $teamId } }
                  createdAt: { gte: $after, lte: $before }
                }
                first: 100
                after: $cursor
              ) {
                nodes {
                  id
                  title
                  state { name }
                  createdAt
                  completedAt
                  labels { nodes { name } }
                  assignee { displayName }
                  url
                  description
                  team { name }
                }
                pageInfo {
                  hasNextPage
                  endCursor
                }
              }
            }
          `;
        
          try {
            const data = await makeLinearRequest(query, { 
              teamId: team.id, 
              after: fromDate.toISOString(), 
              before: toDate.toISOString(),
              cursor: cursor
            });
            
            const issuesData = data.data.issues;
            allIssuesForTeam.push(...(issuesData.nodes || []));
            
            hasNextPage = issuesData.pageInfo.hasNextPage;
            cursor = issuesData.pageInfo.endCursor;
          } catch (error) {
            console.warn(`Failed to fetch issues for team ${team.name}:`, error.message);
            // Return empty array for teams we don't have access to instead of failing
            hasNextPage = false;
          }
        }
        
        return allIssuesForTeam;
      })
    );
    
    // Flatten all issues from all teams
    return allIssues.flat().map(transformToStandardFormat);
  };
  
  const getCurrentOpenIssues = async (identifier) => {
    // Get all teams and aggregate open issues across them
    const teams = await getAllTeams();
    
    const allOpenIssues = await Promise.all(
      teams.map(async (team) => {
        const allIssuesForTeam = [];
        let hasNextPage = true;
        let cursor = null;
        
        while (hasNextPage) {
          const query = `
            query($teamId: ID!, $after: String) {
              issues(
                filter: { 
                  team: { id: { eq: $teamId } }
                  state: { type: { nin: ["completed", "canceled"] } } 
                }
                first: 100
                after: $after
              ) {
                nodes {
                  id
                  title
                  state { name }
                  createdAt
                  completedAt
                  labels { nodes { name } }
                  assignee { displayName }
                  url
                  description
                  team { name }
                }
                pageInfo {
                  hasNextPage
                  endCursor
                }
              }
            }
          `;
        
          try {
            const data = await makeLinearRequest(query, { 
              teamId: team.id, 
              after: cursor 
            });
            
            const issuesData = data.data.issues;
            allIssuesForTeam.push(...(issuesData.nodes || []));
            
            hasNextPage = issuesData.pageInfo.hasNextPage;
            cursor = issuesData.pageInfo.endCursor;
          } catch (error) {
            console.warn(`Failed to fetch open issues for team ${team.name}:`, error.message);
            // Return empty array for teams we don't have access to instead of failing
            hasNextPage = false;
          }
        }
        
        return allIssuesForTeam;
      })
    );
    
    // Flatten all open issues from all teams
    return allOpenIssues.flat().map(transformToStandardFormat);
  };
  
  const transformToStandardFormat = (linearIssue) => ({
    id: linearIssue.id,
    title: linearIssue.title,
    state: mapLinearState(linearIssue.state.name),
    createdAt: linearIssue.createdAt,
    closedAt: linearIssue.completedAt,
    labels: linearIssue.labels?.nodes?.map(l => l.name) || [],
    assignee: linearIssue.assignee?.displayName,
    url: linearIssue.url,
    source: 'linear',
    team: linearIssue.team ? linearIssue.team.name : null
  });
  
  const mapLinearState = (linearState) => {
    const stateMap = {
      'Todo': 'open',
      'In Progress': 'open',
      'In Review': 'open',
      'Done': 'closed',
      'Canceled': 'closed',
      'Cancelled': 'closed'
    };
    return stateMap[linearState] || 'open';
  };
  
  const validateConfig = (config) => {
    if (!config.credentials?.apiKey) {
      throw new Error('Linear API key is required');
    }
    return true;
  };
  
  return {
    getIssues,
    getCurrentOpenIssues,
    transformToStandardFormat,
    validateConfig
  };
};