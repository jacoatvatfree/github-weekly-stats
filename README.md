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

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- GitHub Personal Access Token with `repo` and `read:org` scopes

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

The application will be available at `http://localhost:80` with the API server running on port 81.

## Environment Variables

You can customize the ports used by the application:

- `VITE_PORT` - Port for the frontend development server (default: 80)
- `VITE_API_PORT` - Port for the API server (default: 81)

Example:
```bash
VITE_PORT=3000 VITE_API_PORT=3001 npm run dev
```

## Architecture

The project follows a clean architecture pattern with clear separation of concerns:

```
src/
├── application/     # Application logic and use cases
├── components/      # React components
├── domain/         # Core business logic and entities
└── infrastructure/ # External services integration
```

### Key Technologies

- **Frontend**: React, TailwindCSS, Chart.js
- **Backend**: Fastify
- **API Integration**: GitHub API (via Octokit)

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
- The open-source community for various tools and libraries used in this project
