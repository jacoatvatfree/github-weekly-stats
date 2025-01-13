import { useState } from "react";
import toast from "react-hot-toast";

export default function LoginForm({ onSubmit }) {
  const getLastWeek = () => {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    return lastWeek.toISOString().split("T")[0];
  };

  const [formData, setFormData] = useState({
    token: localStorage.getItem("github_token") || "",
    organization: "",
    fromDate: getLastWeek(),
    toDate: new Date().toISOString().split("T")[0], // Today
  });

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
    // Save token to localStorage
    localStorage.setItem("github_token", formData.token);
    onSubmit(formData);
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
          <button
            type="submit"
            className="w-full bg-primary-600 text-white rounded-md px-4 py-2 hover:bg-primary-700"
          >
            Analyze Organization
          </button>
        </form>
      </div>
    </div>
  );
}
