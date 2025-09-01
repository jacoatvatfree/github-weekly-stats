import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import ExternalTicketingConfig from "./ExternalTicketingConfig";

export default function LoginForm({ onSubmit }) {
  const getLastWeek = () => {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    return lastWeek.toISOString().split("T")[0];
  };

  const [formData, setFormData] = useState({
    token: localStorage.getItem("github_token") || "",
    organization: localStorage.getItem("github_organization") || "",
    fromDate: getLastWeek(),
    toDate: new Date().toISOString().split("T")[0], // Today
  });

  const [showExternalConfig, setShowExternalConfig] = useState(false);
  const [externalConfig, setExternalConfig] = useState(null);

  // Load external ticketing configuration
  useEffect(() => {
    const savedConfig = localStorage.getItem('external_ticketing_config');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setExternalConfig(parsedConfig);
      } catch (error) {
        console.warn('Failed to parse external ticketing config:', error);
        localStorage.removeItem('external_ticketing_config');
      }
    }
  }, []);

  const handleSaveExternalConfig = (newConfig) => {
    setExternalConfig(newConfig);
    localStorage.setItem('external_ticketing_config', JSON.stringify(newConfig));
    toast.success('External ticketing configuration saved');
  };

  const handleClearSavedData = () => {
    localStorage.removeItem('github_token');
    localStorage.removeItem('github_organization');
    localStorage.removeItem('external_ticketing_config');
    setFormData({
      token: "",
      organization: "",
      fromDate: getLastWeek(),
      toDate: new Date().toISOString().split("T")[0],
    });
    setExternalConfig(null);
    toast.success('All saved data cleared');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.token || !formData.organization) {
      toast.error("Please fill in all fields");
      return;
    }
    if (new Date(formData.fromDate) > new Date(formData.toDate)) {
      toast.error("From date cannot be after to date");
      return;
    }
    // Save token and organization to localStorage
    localStorage.setItem("github_token", formData.token);
    localStorage.setItem("github_organization", formData.organization);
    onSubmit({ ...formData, externalConfig });
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <div className="bg-white p-8 rounded-xl shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          GitHub Activity Report
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              GitHub Token
            </label>
            <input
              type="password"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              value={formData.token}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, token: e.target.value }))
              }
              placeholder="ghp_xxxxxxxxxxxx"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Organization Name
            </label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              value={formData.organization}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  organization: e.target.value,
                }))
              }
              placeholder="organization"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                From Date
              </label>
              <input
                type="date"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.fromDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, fromDate: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                To Date
              </label>
              <input
                type="date"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.toDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, toDate: e.target.value }))
                }
              />
            </div>
          </div>
          
          {/* External Ticketing Configuration Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Issue Source
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  {externalConfig?.enabled 
                    ? `Using ${externalConfig.provider === 'linear' ? 'Linear' : externalConfig.provider} for issue analytics`
                    : 'Using GitHub issues for analytics'
                  }
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowExternalConfig(true)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Configure
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={handleClearSavedData}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear saved data
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-primary-600 text-white rounded-md px-4 py-2 hover:bg-primary-700"
          >
            Analyze Organization
          </button>
        </form>
      </div>

      {/* External Ticketing Configuration Modal */}
      <ExternalTicketingConfig
        isOpen={showExternalConfig}
        onClose={() => setShowExternalConfig(false)}
        onSave={handleSaveExternalConfig}
        currentConfig={externalConfig}
      />
    </div>
  );
}
