export default function StatCard({ title, value, icon: Icon }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center">
        {Icon && <Icon className="h-6 w-6 text-primary-500 mr-3" />}
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">
            {value.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
