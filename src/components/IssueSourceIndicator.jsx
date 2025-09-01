import { 
  CogIcon,
  TagIcon
} from '@heroicons/react/24/outline';

export default function IssueSourceIndicator({ 
  getIssueSource, 
  isExternalEnabled,
  externalProvider
}) {
  const currentSource = getIssueSource();
  
  const getSourceIcon = (source) => {
    switch (source) {
      case 'linear':
        return (
          <div className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
            <TagIcon className="h-4 w-4 mr-2" />
            Linear (All Teams)
          </div>
        );
      case 'github':
      default:
        return (
          <div className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            <TagIcon className="h-4 w-4 mr-2" />
            GitHub Issues
          </div>
        );
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Current Issue Source
        </h3>
      </div>

      <div className="text-center py-6">
        <div className="mb-4">
          {getSourceIcon(currentSource)}
        </div>
        
        {currentSource === 'linear' ? (
          <div className="space-y-2">
            <p className="text-gray-700 font-medium">
              Using Linear issues across all teams
            </p>
            <p className="text-sm text-gray-500">
              Analytics are aggregated from all Linear teams you have access to
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-gray-700 font-medium">
              Using GitHub issues
            </p>
            <p className="text-sm text-gray-500">
              External ticketing is configured on the login page
            </p>
          </div>
        )}
      </div>
    </div>
  );
}