import { useState } from 'react';
import { 
  XMarkIcon, 
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function ExternalTicketingConfig({ 
  isOpen, 
  onClose, 
  onSave, 
  currentConfig = null
}) {
  const [config, setConfig] = useState(currentConfig || {
    enabled: false,
    provider: 'linear',
    credentials: {
      apiKey: ''
    }
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  if (!isOpen) return null;

  const handleSave = () => {
    const errors = validateConfig();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    onSave(config);
    onClose();
  };

  const validateConfig = () => {
    const errors = {};
    
    if (config.enabled) {
      if (!config.credentials.apiKey.trim()) {
        errors.apiKey = 'API key is required';
      }
    }
    
    return errors;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            External Ticketing Configuration
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="enabled"
              checked={config.enabled}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                enabled: e.target.checked
              }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="enabled" className="ml-2 text-sm font-medium text-gray-700">
              Use external ticketing system instead of GitHub issues
            </label>
          </div>

          {config.enabled && (
            <>
              {/* Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provider
                </label>
                <select
                  value={config.provider}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    provider: e.target.value
                  }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="linear">Linear</option>
                  <option value="jira" disabled>Jira (Coming Soon)</option>
                  <option value="azure-devops" disabled>Azure DevOps (Coming Soon)</option>
                </select>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Linear API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={config.credentials.apiKey}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      credentials: {
                        ...prev.credentials,
                        apiKey: e.target.value
                      }
                    }))}
                    placeholder="lin_api_..."
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors.apiKey ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-600 hover:text-gray-500"
                  >
                    {showApiKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                {validationErrors.apiKey && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.apiKey}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Get your API key from Linear Settings → API → Personal API Keys
                </p>
              </div>

              {/* Simplified Explanation */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <h4 className="font-medium mb-1">How this works:</h4>
                    <p>
                      When enabled, the application will aggregate issues from <strong>all Linear teams</strong> you have access to, 
                      instead of using GitHub issues. This provides organization-wide issue analytics across all your Linear teams.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end px-6 py-4 border-t space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}