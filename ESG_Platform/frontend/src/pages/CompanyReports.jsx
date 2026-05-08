import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getReport, getUsersList } from "../services/api";

const SCOPE_LABELS = {
  'Scope 1': 'Scope 1 – Direct Emissions',
  'Scope 2': 'Scope 2 – Purchased Energy',
  'Scope 3': 'Scope 3 – Value Chain',
};

export default function CompanyReports() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [report, setReport] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    try {
      const res = await getUsersList();
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to load companies', err);
    }
  };

  const fetchReport = async (userId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getReport(userId);
      setReport(res.data);
    } catch (err) {
      console.error('Failed to load report', err);
      setError('Unable to load report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchReport("");
  }, []);

  useEffect(() => {
    fetchReport(selectedUserId);
  }, [selectedUserId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-green-600">Admin Company Reports</p>
            <h1 className="mt-2 text-3xl font-semibold text-gray-900">Company reports and emissions snapshots</h1>
            <p className="mt-2 text-gray-600 max-w-2xl">Review individual company performance, compare reports, and track e-waste alongside Scope 1, 2, and 3 emissions.</p>
          </div>
          <div className="w-full max-w-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select company</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
            >
              <option value="">Global Aggregate</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-5 text-red-700">
          {error}
        </div>
      )}

      {report && (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            {(report.insights || []).map((item, index) => (
              <div key={index} className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-gray-200">
                <p className="text-sm text-gray-500">{item.title}</p>
                <p className="mt-4 text-3xl font-semibold text-gray-900">{item.value} {item.unit}</p>
              </div>
            ))}
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-gray-200">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-green-600">Report summary</p>
                <h2 className="mt-2 text-2xl font-semibold text-gray-900">{report.company || 'Selected Company'}</h2>
                <p className="mt-2 text-gray-600">{report.timeframe || 'Current quarter'} performance including emissions intensity and value chain contributions.</p>
              </div>
              <div className="rounded-3xl bg-green-50 p-5 text-right">
                <p className="text-sm text-gray-500">Estimated total emissions</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">{report.totalEmissions?.toFixed(1) || 0} tCO₂e</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {Object.entries(report.totals || {}).map(([scope, value]) => (
              <div key={scope} className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-gray-200">
                <p className="text-sm text-gray-500">{SCOPE_LABELS[scope] || scope}</p>
                <p className="mt-3 text-3xl font-semibold text-gray-900">{value.toFixed(2)} tCO₂e</p>
              </div>
            ))}
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900">Activity breakdown</h2>
            <p className="mt-2 text-gray-600">Detailed emissions by activity class for this company.</p>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {report.activityBreakdown && Object.entries(report.activityBreakdown).map(([type, data]) => (
                <div key={type} className="rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between text-sm font-medium text-gray-700">
                    <span>{type.replace(/_/g, ' ')}</span>
                    <span>{data.value.toFixed(1)} units</span>
                  </div>
                  <div className="mt-3 text-xl font-semibold text-green-600">{data.emission.toFixed(2)} tCO₂e</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900">Recommendations</h2>
            <p className="mt-2 text-gray-600">Priority actions for higher-impact reductions and supply chain engagement.</p>
            <ul className="mt-6 space-y-3">
              {(report.actionItems || []).map((item, index) => (
                <li key={index} className="rounded-3xl border border-gray-200 bg-gray-50 p-5 text-gray-800">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
