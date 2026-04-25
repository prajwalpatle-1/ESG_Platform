import { useEffect, useState } from "react";
import { getReport, socket } from "../services/api";

export default function Report() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = () => {
    getReport()
      .then(res => {
        setReport(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching report:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReport();

    // Listen for new activities to update report in real-time
    socket.on('activityAdded', () => {
      fetchReport();
    });

    return () => {
      socket.off('activityAdded');
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No report data available</p>
      </div>
    );
  }

  const totalEmissions = report.totalEmissions || 
    (report.totals ? Object.values(report.totals).reduce((sum, v) => sum + v, 0) : 0);

  const chartData = report.totals ? [
    { label: 'Scope 1', value: report.totals['Scope 1'] || 0, color: 'bg-rose-500' },
    { label: 'Scope 2', value: report.totals['Scope 2'] || 0, color: 'bg-blue-500' },
    { label: 'Scope 3', value: report.totals['Scope 3'] || 0, color: 'bg-green-500' },
  ] : [];

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-700">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-green-600 dark:text-green-400">ESG Reporting</p>
            <h1 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">Executive sustainability scorecard</h1>
            <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl">
              A snapshot of your emissions performance and priority actions for the upcoming quarter.
            </p>
          </div>
          <div className="rounded-3xl bg-gray-50 p-5 text-right dark:bg-gray-950">
            <p className="text-sm text-gray-500 dark:text-gray-400">Reporting period</p>
            <p className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">{report.timeframe}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {(report.insights || []).map((item, index) => (
          <div key={index} className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">{item.title}</p>
            <p className="mt-4 text-3xl font-semibold text-gray-900 dark:text-white">{item.value} {item.unit}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-700">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Emissions breakdown</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400">The chart below shows the contribution of each emissions scope.</p>
            <div className="mt-6 space-y-4">
              {chartData.map((item) => {
                const width = totalEmissions > 0 ? Math.round((item.value / totalEmissions) * 100) : 0;
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                      <span>{item.label}</span>
                      <span>{item.value.toFixed(1)} tCO₂e ({width}%)</span>
                    </div>
                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                      <div className={`${item.color} h-full rounded-full`} style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="rounded-3xl bg-green-50 p-6 dark:bg-green-900/20">
              <p className="text-sm font-semibold text-green-700 dark:text-green-200">Total emissions</p>
              <p className="mt-3 text-4xl font-semibold text-gray-900 dark:text-white">{totalEmissions.toFixed(1)} tCO₂e</p>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Emission totals are based on current supplier and facility data. Focus on Scope 3 to maximize impact.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-700">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Recommended actions</h2>
        <p className="mt-3 text-gray-600 dark:text-gray-400">Priority initiatives for emissions reduction and supplier engagement.</p>
        <ul className="mt-6 space-y-4">
          {(report.actionItems || []).map((item, index) => (
            <li key={index} className="rounded-3xl border border-gray-200 bg-gray-50 p-5 text-gray-800 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200">
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Activity Breakdown Section */}
      {report.activityBreakdown && Object.keys(report.activityBreakdown).length > 0 && (
        <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-700">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Activity Breakdown</h2>
          <p className="mt-3 text-gray-600 dark:text-gray-400">Detailed breakdown of emissions by activity type.</p>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {Object.entries(report.activityBreakdown).map(([type, data]) => (
              <div key={type} className="rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white capitalize">{type.replace(/_/g, ' ')}</span>
                  <span className="text-sm text-gray-500">{data.value.toFixed(1)} units</span>
                </div>
                <div className="mt-2 text-lg font-semibold text-green-600">
                  {data.emission.toFixed(2)} tCO₂e
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}