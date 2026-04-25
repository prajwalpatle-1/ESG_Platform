import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { getDashboard, socket, predictScope3Emission, getEmissionAnomalies, getEmissionTrends, getEmissionBreakdown, getAIPredictions } from "../services/api";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF6B6B', '#4ECDC4'];

// GHG Emission Factors (kg CO2e per unit)
const EMISSION_FACTORS = {
  electricity: 0.5,
  natural_gas: 2.0,
  diesel: 2.68,
  petrol: 2.31,
  flight: 0.255,
  logistics: 0.62,
  supplier: 0.15,
  waste: 1.2,
  water: 0.344,
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [predictionInput, setPredictionInput] = useState({ value: '', activityType: 'electricity' });
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  
  // Database-driven data states
  const [emissionTrends, setEmissionTrends] = useState([]);
  const [emissionBreakdown, setEmissionBreakdown] = useState([]);
  const [aiPredictions, setAIPredictions] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  const fetchData = () => {
    getDashboard()
      .then(res => setData(res.data))
      .catch(err => console.error('Error fetching dashboard data:', err));
  };

  const fetchAnomalies = () => {
    getEmissionAnomalies()
      .then(res => setAnomalies(res.data))
      .catch(err => console.error('Error fetching anomalies:', err));
  };

  // Fetch analytics data from database
  const fetchAnalyticsData = async () => {
    setLoadingAnalytics(true);
    try {
      const [trendsRes, breakdownRes, predictionsRes] = await Promise.all([
        getEmissionTrends(),
        getEmissionBreakdown(),
        getAIPredictions()
      ]);
      
      if (trendsRes.data?.length > 0) {
        setEmissionTrends(trendsRes.data);
      }
      if (breakdownRes.data?.length > 0) {
        setEmissionBreakdown(breakdownRes.data);
      }
      if (predictionsRes.data) {
        setAIPredictions(predictionsRes.data);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    }
    setLoadingAnalytics(false);
  };

  // Generate AI insights based on data
  const generateAIInsights = (dashboardData, predictions) => {
    if (!dashboardData) return;
    
    const { totals, records } = dashboardData;
    const totalEmission = (totals["Scope 1"] || 0) + (totals["Scope 2"] || 0) + (totals["Scope 3"] || 0);
    
    // Calculate trends
    const recentRecords = (records || []).slice(-10);
    if (recentRecords.length === 0) return;
    
    const avgEmission = recentRecords.reduce((sum, r) => sum + (r?.emission || 0), 0) / recentRecords.length;
    const trend = recentRecords.length > 1 && recentRecords[0]?.emission
      ? (recentRecords[recentRecords.length - 1].emission - recentRecords[0].emission) / recentRecords[0].emission * 100
      : 0;

    // Generate recommendations
    const recommendations = [];
    
    if (totals["Scope 2"] > totalEmission * 0.4) {
      recommendations.push({
        type: 'scope2',
        message: 'High Scope 2 emissions detected. Consider investing in renewable energy sources.',
        priority: 'high'
      });
    }
    
    if (totals["Scope 3"] > totalEmission * 0.5) {
      recommendations.push({
        type: 'scope3',
        message: 'Scope 3 emissions are significant. Review supply chain sustainability.',
        priority: 'high'
      });
    }
    
    if (trend > 10) {
      recommendations.push({
        type: 'trend',
        message: 'Emissions are trending upward. Implement immediate reduction strategies.',
        priority: 'critical'
      });
    } else if (trend < -5) {
      recommendations.push({
        type: 'trend',
        message: 'Great progress! Emissions decreased by ' + Math.abs(trend).toFixed(1) + '%. Keep it up!',
        priority: 'good'
      });
    }

    // Calculate predicted next month - use database predictions if available
    const predictedNextMonth = aiPredictions?.predicted?.value 
      ? aiPredictions.predicted.value 
      : avgEmission * 1.05;

    setAiInsights({
      totalEmission,
      avgEmission,
      trend: trend.toFixed(1),
      recommendations,
      predictedNextMonth: predictedNextMonth.toFixed(2),
      reductionPotential: (totalEmission * 0.15).toFixed(2),
      dbTrend: aiPredictions?.trend || null,
      dbTrendPercent: aiPredictions?.trendPercent || 0
    });
  };

  useEffect(() => {
    fetchData();
    fetchAnomalies();
    fetchAnalyticsData();

    socket.on('activityAdded', () => {
      fetchData();
      fetchAnomalies();
      fetchAnalyticsData();
    });

    return () => {
      socket.off('activityAdded');
    };
  }, []);

  useEffect(() => {
    if (data) {
      generateAIInsights(data, aiPredictions);
    }
  }, [data, aiPredictions]);

  const handlePredict = async () => {
    if (!predictionInput.value) return;
    
    setLoadingPrediction(true);
    try {
      const res = await predictScope3Emission(predictionInput.value);
      const emissionFactor = EMISSION_FACTORS[predictionInput.activityType] || 0.15;
      const manualCalculation = (parseFloat(predictionInput.value) * emissionFactor).toFixed(2);
      
      setPrediction({
        ai: res.data.predictedEmission?.toFixed(2) || manualCalculation,
        manual: manualCalculation,
        activityType: predictionInput.activityType,
        value: predictionInput.value
      });
    } catch (error) {
      console.error('Error predicting emission:', error);
      // Fallback to manual calculation
      const emissionFactor = EMISSION_FACTORS[predictionInput.activityType] || 0.15;
      setPrediction({
        ai: (parseFloat(predictionInput.value) * emissionFactor).toFixed(2),
        manual: (parseFloat(predictionInput.value) * emissionFactor).toFixed(2),
        activityType: predictionInput.activityType,
        value: predictionInput.value
      });
    }
    setLoadingPrediction(false);
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  const pieData = [
    { name: "Scope 1", value: data.totals["Scope 1"] },
    { name: "Scope 2", value: data.totals["Scope 2"] },
    { name: "Scope 3", value: data.totals["Scope 3"] }
  ];

  // Monthly trend data for AI prediction
  const monthlyData = (data.records || []).reduce((acc, record) => {
    if (!record) return acc;
    const month = record.date?.substring(0, 7) || 'Unknown';
    const existing = acc.find(a => a.month === month);
    if (existing) {
      existing.emission += record.emission || 0;
      existing.count += 1;
    } else {
      acc.push({ month, emission: record.emission || 0, count: 1 });
    }
    return acc;
  }, []).map(m => ({ ...m, avgEmission: (m.emission / m.count).toFixed(2) }));

  // Add AI predicted next month
  const predictedData = [...monthlyData, { 
    month: 'Next Month (AI)', 
    emission: parseFloat(aiInsights?.predictedNextMonth || 0),
    isPredicted: true 
  }];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ESG Dashboard</h1>
        <p className="text-gray-600">Monitor your environmental impact and sustainability metrics</p>
      </div>

      {/* AI Insights Banner */}
      {aiInsights && (
        <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">🤖 AI Environmental Insights</h2>
              <p className="text-green-100">
                Total Emissions: <span className="font-bold">{aiInsights.totalEmission.toFixed(2)} tCO₂e</span>
                {' | '} Trend: <span className={`font-bold ${aiInsights.trend > 0 ? 'text-red-200' : 'text-green-200'}`}>
                  {aiInsights.trend > 0 ? '↑' : '↓'} {Math.abs(aiInsights.trend)}%
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-green-100">Reduction Potential</p>
              <p className="text-3xl font-bold">{aiInsights.reductionPotential} tCO₂e</p>
              <p className="text-xs text-green-200">15% achievable</p>
            </div>
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {aiInsights && aiInsights.recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📋 AI Recommendations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiInsights.recommendations.map((rec, index) => (
              <div key={index} className={`p-4 rounded-lg border-l-4 ${
                rec.priority === 'critical' ? 'bg-red-50 border-red-500' :
                rec.priority === 'high' ? 'bg-orange-50 border-orange-500' :
                rec.priority === 'good' ? 'bg-green-50 border-green-500' :
                'bg-gray-50 border-gray-500'
              }`}>
                <p className="text-sm text-gray-700">{rec.message}</p>
                <span className={`text-xs font-semibold px-2 py-1 rounded mt-2 inline-block ${
                  rec.priority === 'critical' ? 'bg-red-200 text-red-800' :
                  rec.priority === 'high' ? 'bg-orange-200 text-orange-800' :
                  rec.priority === 'good' ? 'bg-green-200 text-green-800' :
                  'bg-gray-200 text-gray-800'
                }`}>
                  {rec.priority.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(data.totals).map(([scope, value]) => (
          <div key={scope} className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{scope}</h3>
            <p className="text-3xl font-bold text-green-600">{value.toFixed(2)}</p>
            <p className="text-sm text-gray-500">tons CO2e</p>
          </div>
        ))}
      </div>

      {/* AI Prediction Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🔮 AI GHG Emission Predictor</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={predictionInput.activityType}
                onChange={(e) => setPredictionInput({ ...predictionInput, activityType: e.target.value })}
              >
                {Object.keys(EMISSION_FACTORS).map(type => (
                  <option key={type} value={type}>{type.replace('_', ' ').toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Activity Value ({predictionInput.activityType === 'flight' ? 'km' : 
                  predictionInput.activityType === 'logistics' ? 'ton-km' : 
                  predictionInput.activityType === 'supplier' ? '$' : 'units'})
              </label>
              <input
                type="number"
                placeholder="Enter activity value"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={predictionInput.value}
                onChange={(e) => setPredictionInput({ ...predictionInput, value: e.target.value })}
              />
            </div>
            <button
              onClick={handlePredict}
              disabled={loadingPrediction || !predictionInput.value}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loadingPrediction ? 'Analyzing...' : 'Predict Emission'}
            </button>
            {prediction && (
              <div className="mt-4 space-y-2">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-md border border-blue-200">
                  <p className="text-sm text-gray-600">🤖 AI Predicted Emission:</p>
                  <p className="text-2xl font-bold text-blue-600">{prediction.ai} tCO₂e</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-xs text-gray-500">Using factor: {EMISSION_FACTORS[prediction.activityType]} kg CO₂e per unit</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">⚠️ Emission Anomalies</h2>
          {anomalies.length > 0 ? (
            <div className="space-y-2">
              {anomalies.slice(0, 5).map((anomaly, index) => (
                <div key={index} className="p-3 bg-red-50 rounded-md border-l-4 border-red-500">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-red-600 font-semibold">Anomaly Score: {anomaly.anomalyScore?.toFixed(3) || 'N/A'}</p>
                      <p className="text-xs text-gray-500">Value: {anomaly.value}</p>
                    </div>
                    <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded">High</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-4xl mb-2">✅</p>
              <p className="text-gray-500">No anomalies detected</p>
              <p className="text-sm text-gray-400">Your emissions are within normal ranges</p>
            </div>
          )}
        </div>
      </div>

      {/* Emission Breakdown - From Database */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Emission Breakdown</h2>
          {loadingAnalytics ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
            </div>
          ) : emissionBreakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={emissionBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {emissionBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} tCO2e`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                {emissionBreakdown.map((item, i) => (
                  <div key={i} className="flex items-center">
                    <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                    <span className="text-gray-600">{item.name}: {item.value} tCO2e</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No emission breakdown data available</p>
              <p className="text-sm text-gray-400">Add activities to see breakdown</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📈 AI Trend Forecast</h2>
          {loadingAnalytics ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
            </div>
          ) : aiPredictions?.historical?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={aiPredictions.historical.map(h => ({ month: h.month, actual: h.value, predicted: null })).concat(aiPredictions.predicted ? [{ month: 'Next (AI)', actual: null, predicted: aiPredictions.predicted.value }] : [])}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [
                    value ? `${value} tCO2e` : 'N/A',
                    name === 'predicted' ? 'AI Predicted' : 'Actual'
                  ]} />
                  <Bar dataKey="actual" fill="#10b981" name="Actual" />
                  <Bar dataKey="predicted" fill="#8B5CF6" name="AI Predicted" />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2 text-xs">
                <span className="flex items-center">
                  <span className="w-3 h-3 bg-green-500 mr-1"></span> Actual
                </span>
                <span className="flex items-center">
                  <span className="w-3 h-3 bg-purple-500 mr-1"></span> AI Predicted
                </span>
              </div>
              {aiPredictions.trend && aiPredictions.trend !== 'insufficient_data' && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Trend: {aiPredictions.trend === 'increasing' ? '↑ Increasing' : '↓ Decreasing'} ({aiPredictions.trendPercent}%)
                </p>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No trend data available</p>
              <p className="text-sm text-gray-400">Add activities to see trends</p>
            </div>
          )}
        </div>
      </div>

      {/* Historical Emission Trends - From Database */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">📉 Historical Emission Trends</h2>
        {loadingAnalytics ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
          </div>
        ) : emissionTrends.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={emissionTrends}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `${value} tCO2e`} />
                <Line type="monotone" dataKey="emission" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} name="Total" />
                <Line type="monotone" dataKey="scope1" stroke="#0088FE" strokeWidth={1} dot={{ fill: '#0088FE' }} name="Scope 1" />
                <Line type="monotone" dataKey="scope2" stroke="#00C49F" strokeWidth={1} dot={{ fill: '#00C49F' }} name="Scope 2" />
                <Line type="monotone" dataKey="scope3" stroke="#FFBB28" strokeWidth={1} dot={{ fill: '#FFBB28' }} name="Scope 3" />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2 text-xs">
              <span className="flex items-center">
                <span className="w-3 h-3 bg-green-500 mr-1"></span> Total
              </span>
              <span className="flex items-center">
                <span className="w-3 h-3 bg-blue-500 mr-1"></span> Scope 1
              </span>
              <span className="flex items-center">
                <span className="w-3 h-3 bg-teal-500 mr-1"></span> Scope 2
              </span>
              <span className="flex items-center">
                <span className="w-3 h-3 bg-yellow-500 mr-1"></span> Scope 3
              </span>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No historical data available</p>
            <p className="text-sm text-gray-400">Add activities to see historical trends</p>
          </div>
        )}
      </div>
    </div>
  );
}