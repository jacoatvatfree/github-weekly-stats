import { useState, useEffect } from "react";
import {
  CodeBracketIcon,
  CircleStackIcon,
  ArrowPathIcon,
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
          monthlyIssueStats: result.monthlyIssueStats,
          memberCount: organization.members.length,
          closedIssues: organization.getClosedIssueTitles(),
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
        <h1 className="text-2xl font-bold text-gray-900">
          {credentials.organization} Analysis
        </h1>
        <button
          onClick={onReset}
          className="px-4 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
        >
          Change Organization
        </button>
      </div>

      <AISummary data={data} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <StatCard
          title="Total Commits"
          value={data.yearlyStats.commits}
          icon={CodeBracketIcon}
        />
        <StatCard
          title="Issues Opened/Closed"
          value={`${data.yearlyStats.issues.opened}  / ${data.yearlyStats.issues.closed} `}
          icon={CircleStackIcon}
        />
        <StatCard
          title="PR Opened/Closed"
          value={`${data.yearlyStats.pullRequests.opened}  / ${data.yearlyStats.pullRequests.closed} `}
          icon={ArrowPathIcon}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Issue Trends</h3>
          <BurnupChart
            monthlyStats={data.monthlyIssueStats}
            fromDate={credentials.fromDate}
            toDate={credentials.toDate}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Pull Request Types</h3>
          <PullRequestTypeChart prTypeStats={data.prTypes} />
        </div>
      </div>

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
                <div className="text-sm text-gray-500">
                  <span className="mr-4">{repo.commitCount} commits</span>
                  <span>{repo.closedIssues} issues closed</span>
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

      <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Recently Closed Issues</h3>
        <div className="space-y-2">
          {data.closedIssues.slice(0, 5).map((issue) => (
            <div
              key={issue.id}
              className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600"
            >
              {issue.title}
            </div>
          ))}
        </div>
      </div>

      {/* Add PRCarousel component */}
      <PRCarousel pullRequests={data.pullRequests} />
    </div>
  );
}
