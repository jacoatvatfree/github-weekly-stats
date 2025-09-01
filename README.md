# GitHub Team Weekly Report

A dashboard for analyzing GitHub organization metrics and trends over the last week (or custom dates). This tool provides insights into repository activities, pull request patterns, and organizational health through interactive visualizations. It shows any images attached to closed pull requests for the duration.

## Features

- 📊 Real-time organization metrics and statistics
- 📈 Interactive charts showing PR trends and patterns
- 🔄 Pull Request type distribution analysis
- 📅 Burnup chart for tracking progress
- 🤖 AI-powered summary of organization activity
- 🖼️ PR Carousel showing recent pull requests
- 🔐 Secure GitHub token authentication
- 🎯 **External Ticketing Integration** - Use Linear, Jira, or other issue trackers alongside GitHub

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- GitHub Personal Access Token with `repo` and `read:org` scopes
- (Optional) Linear API Key for Linear integration

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/github-org-analyzer.git
cd github-org-analyzer
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000` with the API server running on port 4010.

## External Ticketing System Integration

This application supports integrating external ticketing systems (Linear, Jira, Azure DevOps, etc.) as an alternative to GitHub issues for organization-wide analytics. This allows you to:

- Use Linear issues for **all repositories** in your organization
- Maintain consistent analytics across different issue sources
- Get organization-wide insights from your preferred ticketing system

### Supported Systems

- ✅ **Linear** - Full integration with GraphQL API
- 🚧 **Jira** - Coming soon
- 🚧 **Azure DevOps** - Coming soon

### Setting Up Linear Integration

1. **Get Linear API Key**:
   - Go to Linear Settings → API → Personal API Keys
   - Create a new API key with read access
   - Copy the key (starts with `lin_api_`)

2. **Configure in the Application**:
   - Open the dashboard and navigate to "Issue Source Configuration"
   - Click "Configure" button
   - Enable external ticketing integration
   - Select "Linear" as the provider
   - Enter your Linear API key

3. **How it Works**:
   - When enabled, the system automatically aggregates issues from **all Linear teams** you have access to
   - No complex repository mapping required - just enable and go!
   - All organization analytics will use Linear data instead of GitHub issues

### Configuration Example

```javascript
{
  "enabled": true,
  "provider": "linear",
  "credentials": {
    "apiKey": "lin_api_1234567890abcdef"
  }
}
```

### Data Consistency

The system automatically standardizes issue data from different sources:

```javascript
// Standardized Issue Format
{
  id: string,
  title: string,
  state: 'open' | 'closed',
  createdAt: string,
  closedAt: string | null,
  labels: string[],
  assignee: string | null,
  url: string,
  source: 'github' | 'linear' | 'jira'
}
```

### Backward Compatibility

- Existing GitHub-only workflows remain unchanged
- Configuration is optional - app works without external integration
- Repository-level configuration allows gradual adoption
- All analytics and charts work seamlessly with mixed data sources

## Environment Variables

### Development
You can customize the ports used during development:

- `PORT` - Port for the API server (default: 4010)

The Vite development server runs on port 3000 and proxies API calls to the backend.

### Production
In production, only the API server runs and serves both the frontend and API:

- `PORT` - Port for the combined server (default: 4010)

## Architecture

The project follows a clean architecture pattern with clear separation of concerns:

```
src/
├── application/     # Application logic and use cases
├── components/      # React components
├── domain/         # Core business logic and entities
└── infrastructure/ # External services integration
    ├── adapters/   # External ticketing system adapters
    │   ├── base-issue-adapter.js
    │   ├── github-issue-adapter.js
    │   ├── linear-issue-adapter.js
    │   └── adapter-factory.js
    ├── github/     # GitHub API integration
    └── multi-source-issue-service.js
```

### Key Technologies

- **Frontend**: React, TailwindCSS, Chart.js
- **Backend**: Fastify
- **API Integration**: GitHub API (via Octokit), Linear GraphQL API
- **Architecture**: Adapter Pattern with Dependency Injection

### Adding New Ticketing Systems

To add support for a new ticketing system (e.g., Jira):

1. **Create Adapter**: Implement `src/infrastructure/adapters/jira-issue-adapter.js`
2. **Update Factory**: Add Jira case to `adapter-factory.js`
3. **Add UI Support**: Update `ExternalTicketingConfig.jsx` with Jira options
4. **Configure Mapping**: Define how Jira data maps to the standard format

Example adapter structure:
```javascript
export const createJiraIssueAdapter = (dependencies) => {
  const { httpClient, config } = dependencies;
  
  return {
    getIssues: async (projectKey, fromDate, toDate) => {
      // Jira API implementation
    },
    getCurrentOpenIssues: async (projectKey) => {
      // Jira API implementation  
    },
    transformToStandardFormat: (jiraIssue) => {
      // Convert Jira format to standard format
    },
    validateConfig: (config) => {
      // Validate Jira configuration
    }
  };
};
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- GitHub API for providing comprehensive organization data
- Linear for their excellent GraphQL API
- The open-source community for various tools and libraries used in this project
