import { useState, useEffect } from "react";
import {
  CodeBracketIcon,
  ChatBubbleBottomCenterTextIcon,
  ArrowsRightLeftIcon,
  StarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { GithubRepository } from "../infrastructure/github-repository";
import { Organization } from "../domain/organization";
import BurnupChart from "./BurnupChart";
import PullRequestTypeChart from "./PullRequestTypeChart";
import AISummary from "./AISummary";
import PRCarousel from "./PRCarousel";
import toast from "react-hot-toast";
import StatCard from "./StatCard";

export default function Dashboard({ credentials, onReset }) {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [data, setData] = useState(null);
  const [highlightedPRs, setHighlightedPRs] = useState(new Set());
  const [isIssuesExpanded, setIsIssuesExpanded] = useState(true);
  const [isPRsExpanded, setIsPRsExpanded] = useState(true);

  // Load highlighted PRs from localStorage on component mount
  useEffect(() => {
    const savedHighlights = localStorage.getItem('highlighted_prs');
    if (savedHighlights) {
      try {
        const parsedData = JSON.parse(savedHighlights);
        const now = new Date().getTime();
        const fourHours = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
        
        // Check if the data is still valid (within 4 hours)
        if (parsedData.timestamp && (now - parsedData.timestamp) < fourHours) {
          // Convert the stored format to a Set of PR keys (repo/prNumber)
          const prKeys = new Set();
          if (parsedData.prKeys) {
            parsedData.prKeys.forEach(key => prKeys.add(key));
          }
          setHighlightedPRs(prKeys);
        } else {
          // Data is expired, remove it
          localStorage.removeItem('highlighted_prs');
        }
      } catch (error) {
        console.warn('Failed to parse highlighted PRs from localStorage:', error);
        localStorage.removeItem('highlighted_prs');
      }
    }
  }, []);

  // Save highlighted PRs to localStorage whenever the set changes
  useEffect(() => {
    // Only save if we have highlights to save
    if (highlightedPRs.size > 0) {
      const dataToSave = {
        prKeys: Array.from(highlightedPRs),
        timestamp: new Date().getTime()
      };
      localStorage.setItem('highlighted_prs', JSON.stringify(dataToSave));
    }
  }, [highlightedPRs]);

  const toggleHighlight = (pr) => {
    // Create a unique key using repo and PR number
    const prKey = `${pr.repo}#${pr.number}`;
    
    setHighlightedPRs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(prKey)) {
        newSet.delete(prKey);
      } else {
        newSet.add(prKey);
      }
      return newSet;
    });
  };

  const isPRHighlighted = (pr) => {
    const prKey = `${pr.repo}#${pr.number}`;
    return highlightedPRs.has(prKey);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const repository = new GithubRepository(credentials.token);
        const result = await repository.getOrganization(
          credentials.organization,
          {
            fromDate: credentials.fromDate,
            toDate: credentials.toDate,
          },
          (current, total) => setProgress({ current, total }),
        );

        const organization = new Organization(
          result.name,
          result.repos,
          result.members,
          result.yearlyStats,
        );

        setData({
          repos: organization.getMostActiveRepos(),
          members: organization.getMostActiveMembers(),
          yearlyStats: organization.getYearlyStats(),
          prTypes: organization.getPullRequestTypeStats(),
          dailyIssueStats: result.dailyIssueStats,
          memberCount: organization.members.length,
          closedIssues: organization.getClosedIssueTitles(),
          closedPRs: organization.getClosedPRTitles(),
          topRepos: organization.getMostActiveRepos(),
          pullRequests: result.pullRequests || [], // Add this line to include pull requests
        });
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Failed to fetch organization data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [credentials]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <div className="text-gray-600 text-lg">
          Analyzing repositories... {progress.current}/{progress.total}
        </div>
        {progress.total > 0 && (
          <div className="mt-4 w-64">
            <div className="bg-primary-100 rounded-full h-2.5">
              <div
                className="bg-primary-500 h-2.5 rounded-full transition-all duration-300"
                style={{
                  width: `${(progress.current / progress.total) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        )}{" "}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1
          onClick={onReset}
          className="text-2xl font-bold text-gray-900 hover:text-primary-600 cursor-pointer"
        >
          {credentials.organization} activity
        </h1>
        <div
          onClick={onReset}
          className="text-sm text-gray-500 hover:text-primary-600 cursor-pointer flex items-center"
        >
          {new Date(credentials.fromDate).toLocaleDateString()} -{" "}
          {new Date(credentials.toDate).toLocaleDateString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <StatCard
          title="Total Commits"
          value={data.yearlyStats.commits}
          icon={CodeBracketIcon}
        />
        <StatCard
          title="Issues Opened/Closed"
          value={`${data.yearlyStats.issues.opened}  / ${data.yearlyStats.issues.closed} `}
          icon={ChatBubbleBottomCenterTextIcon}
        />
        <StatCard
          title="PR Opened/Closed"
          value={`${data.yearlyStats.pullRequests.opened}  / ${data.yearlyStats.pullRequests.closed} `}
          icon={ArrowsRightLeftIcon}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Issues Burn</h3>
          <BurnupChart
            dailyStats={data.dailyIssueStats}
            fromDate={credentials.fromDate}
            toDate={credentials.toDate}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Pull Request Types</h3>
          <PullRequestTypeChart prTypeStats={data.prTypes} />
        </div>
      </div>
      
      {data.closedIssues && data.closedIssues.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setIsIssuesExpanded(!isIssuesExpanded)}
          >
            <h3 className="text-lg font-semibold">Recently Closed Issues</h3>
            {isIssuesExpanded ? (
              <ChevronDownIcon className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronRightIcon className="h-5 w-5 text-gray-500" />
            )}
          </div>
          {isIssuesExpanded && (
            <div className="space-y-2 mt-4">
              {data.closedIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <ChatBubbleBottomCenterTextIcon className="h-4 w-4 text-gray-500" />
                    <span>{issue.title}</span>
                  </div>
                  <svg
                    className="h-4 w-4 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {data.closedPRs && data.closedPRs.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setIsPRsExpanded(!isPRsExpanded)}
          >
            <h3 className="text-lg font-semibold">
              Recently Closed Pull Requests
            </h3>
            {isPRsExpanded ? (
              <ChevronDownIcon className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronRightIcon className="h-5 w-5 text-gray-500" />
            )}
          </div>
          {isPRsExpanded && (
            <div className="space-y-2 mt-4">
              {data.closedPRs.map((pr) => (
                <div
                  key={pr.id}
                  className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <ArrowsRightLeftIcon className="h-4 w-4 text-gray-500" />
                    <span
                      className={`transition-colors duration-200 ${
                        isPRHighlighted(pr)
                          ? "bg-yellow-200 px-1 rounded"
                          : ""
                      }`}
                    >
                      {pr.title} ({pr.repo})
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <StarIcon
                      className={`h-4 w-4 cursor-pointer transition-colors duration-200 ${
                        isPRHighlighted(pr)
                          ? "text-yellow-500 fill-current"
                          : "text-gray-400 hover:text-yellow-500"
                      }`}
                      onClick={() => toggleHighlight(pr)}
                    />
                    <svg
                      className="h-4 w-4 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Add PRCarousel component */}
      <PRCarousel pullRequests={data.pullRequests} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">
            Most Active Repositories
          </h3>
          <div className="space-y-4">
            {data.repos.map((repo) => (
              <div
                key={repo.name}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <span className="font-medium">{repo.name}</span>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span className="flex items-center text-gray-600">
                    <CodeBracketIcon className="h-4 w-4 mr-1" />
                    {repo.commitCount} commits
                  </span>
                  <span className="flex items-center text-gray-600">
                    <ChatBubbleBottomCenterTextIcon className="h-4 w-4 mr-1" />
                    {repo.closedIssues} issues
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">
            Most Active Contributors
          </h3>
          <div className="space-y-4">
            {data.members.map((member) => (
              <div
                key={member.login}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <span className="font-medium">{member.login}</span>
                <span className="text-sm text-gray-500">
                  {member.contributions} contributions
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
