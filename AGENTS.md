# AGENTS.md - Development Guidelines

## Build/Test Commands
- `npm run dev` - Start development server with Vite frontend and Fastify backend
- `npm run build` - Build production bundle with Vite
- `npm run server` - Start backend server only
- `npm run preview` - Preview production build

## Project Structure
- Frontend: React + Vite (ES modules, JSX)
- Backend: Fastify server with CORS and static file serving
- Architecture: Domain-driven design with application/domain/infrastructure layers

## Code Style Guidelines
- Use ES modules (`import`/`export default`)
- Prefer function declarations for components (`function ComponentName()`)
- Use destructuring for props (`{ credentials, onReset }`)
- Use camelCase for variables and functions
- Use PascalCase for components and classes
- JSX: Use double quotes, self-closing tags when possible

## Error Handling
- Use try/catch blocks for async operations
- Log errors with `console.error()` or `console.warn()`
- Show user-friendly error messages via `react-hot-toast`
- Return early on error conditions

## Dependencies
- UI: React 18, Tailwind CSS, Heroicons
- Charts: Chart.js with react-chartjs-2
- API: Octokit for GitHub API
- Backend: Fastify with CORS and static file plugins