const pool = require('./config/db');
const bcrypt = require('bcryptjs');

const getUsers = async () => {
  const result = await pool.query('SELECT * FROM users');
  return result.rows;
};

const getUserByEmail = async (email) => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
};

const getUserById = async (id) => {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0];
};

const createUser = async (email, password, name = '', role = 'user') => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at',
    [email, hashedPassword, name, role]
  );
  return result.rows[0];
};

const verifyPassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

const DEFAULT_EMISSION_FACTORS = {
  scope3_eWaste: { factor: 1.2, scope: 'Scope 3' },
  scope3_Transportation: { factor: 0.12, scope: 'Scope 3' },
  scope3_Purchased Goods: { factor: 0.15, scope: 'Scope 3' },
  scope3_Spend-Based: { factor: 0.0001, scope: 'Scope 3' },
  scope3_Travel: { factor: 0.1, scope: 'Scope 3' },
  scope1_Diesel: { factor: 2.68, scope: 'Scope 1' },
  scope1_Petrol: { factor: 2.31, scope: 'Scope 1' },
  scope1_LPG: { factor: 1.5, scope: 'Scope 1' },
  scope1_Natural Gas: { factor: 2.0, scope: 'Scope 1' },
  scope2_electricity: { factor: 0.82, scope: 'Scope 2' }
};

const getEmissionFactors = async () => {
  const result = await pool.query('SELECT * FROM emission_factors');
  const emissionFactors = result.rows.reduce((acc, row) => {
    acc[row.activity_type] = { factor: parseFloat(row.factor), scope: row.scope };
    return acc;
  }, {});
  return { ...DEFAULT_EMISSION_FACTORS, ...emissionFactors };
};

const getActivityData = async (userId = null) => {
  let query = 'SELECT * FROM activities';
  let values = [];

  if (userId) {
    query += ' WHERE user_id = $1';
    values.push(userId);
  }
  query += ' ORDER BY created_at DESC';
  const result = await pool.query(query, values);
  return result.rows;
};

const getSuppliers = async () => {
  const result = await pool.query('SELECT * FROM suppliers');
  return result.rows;
};

const getAuditLogs = async () => {
  const result = await pool.query('SELECT * FROM audit_logs');
  return result.rows;
};

const addActivity = async (activityData, userId) => {
  const { activity_type, value, date } = activityData;
  
  const query = `
    INSERT INTO activities (activity_type, value, date, user_id) 
    VALUES ($1, $2, $3, $4) 
    RETURNING *;
  `;
  // Pass userId as the 4th value
  const result = await pool.query(query, [activity_type, value, date, userId]);
  return result.rows[0];
};

const addSupplier = async (supplierData) => {
  const { name, category, location, emissions, change } = supplierData; // <--- LINE 63 is likely here

  const query = `
    INSERT INTO suppliers (name, category, location, emissions, "change")
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

  // Make sure you pass all 5 values to the pool query
  const values = [
    name, 
    category, 
    location || 'Unknown', 
    emissions || 0, 
    change || 0
  ];

  const res = await pool.query(query, values);
  return res.rows[0];
};

const addAuditLog = async (log) => {
  const { action, user_id, details } = log;
  await pool.query(
    'INSERT INTO audit_logs (action, user_id, details) VALUES ($1, $2, $3)',
    [action, user_id, details]
  );
};

// Get historical emission trends (monthly aggregated)
const getEmissionTrends = async (year = null, userId = null) => {
  try {
    const currentYear = year || new Date().getFullYear();
    let query = `
      SELECT 
        TO_CHAR(TO_DATE(date, 'YYYY-MM-DD'), 'YYYY-MM') as month,
        activity_type,
        SUM(value) as total_value,
        COUNT(*) as activity_count
      FROM activities 
      WHERE date LIKE $1
    `;
    let values = [`${currentYear}%`];
    if (userId) {
      query += ` AND user_id = $2`;
      values.push(userId);
    }

    // Finish with the grouping
    query += `
      GROUP BY TO_CHAR(TO_DATE(date, 'YYYY-MM-DD'), 'YYYY-MM'), activity_type
      ORDER BY month
    `;
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Error fetching emission trends:', error);
    return [];
  }
};

// Get emission breakdown by scope
const getEmissionBreakdown = async (userId = null) => {
  try {
    const activityData = await getActivityData(userId);
    const emissionFactors = await getEmissionFactors();
    const breakdownMap = {};

    activityData.forEach(activity => {
      const factor = emissionFactors[activity.activity_type];
      if (!factor) return;

      if (!breakdownMap[activity.activity_type]) {
        breakdownMap[activity.activity_type] = {
          scope: factor.scope,
          activity_type: activity.activity_type,
          total_value: 0,
          total_emission: 0
        };
      }

      breakdownMap[activity.activity_type].total_value += parseFloat(activity.value);
      breakdownMap[activity.activity_type].total_emission += parseFloat(activity.value) * factor.factor;
    });

    return Object.values(breakdownMap).sort((a, b) => {
      if (a.scope === b.scope) {
        return b.total_emission - a.total_emission;
      }
      return a.scope.localeCompare(b.scope);
    });
  } catch (error) {
    console.error('Error fetching emission breakdown:', error);
    return [];
  }
};

// Get AI predictions data
const getAIPredictions = async (userId = null) => {
  try {
    let query = `
      SELECT 
        TO_CHAR(TO_DATE(date, 'YYYY-MM-DD'), 'YYYY-MM') as month,
        SUM(value) as total_value,
        COUNT(*) as activity_count
      FROM activities 
    `;
    let values = [];
    if (userId) {
      query += ` WHERE user_id = $1`;
      values.push(userId);
    }
    query += `
      GROUP BY TO_CHAR(TO_DATE(date, 'YYYY-MM-DD'), 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 6
    `;
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Error fetching AI predictions data:', error);
    return [];
  }
};

// Get dashboard summary with all required data
const getDashboardSummary = async (userId = null) => {
  try {
    const activityData = await getActivityData(userId);
    const emissionFactors = await getEmissionFactors();
    
    const user = userId ? await getUserById(userId) : null;
    const company = user ? (user.name || user.email) : 'Global Aggregate';

    // Calculate totals by scope
    const scopeTotals = { 'Scope 1': 0, 'Scope 2': 0, 'Scope 3': 0 };
    
    for (const activity of activityData) {
      const factor = emissionFactors[activity.activity_type];
      if (factor) {
        const emission = activity.value * factor.factor;
        scopeTotals[factor.scope] = (scopeTotals[factor.scope] || 0) + emission;
      }
    }
    
    return {
      company,
      totals: scopeTotals,
      activityCount: activityData.length,
      lastUpdated: activityData.length > 0 ? activityData[0].created_at : null
    };
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return { company: 'Global Aggregate', totals: { 'Scope 1': 0, 'Scope 2': 0, 'Scope 3': 0 }, activityCount: 0 };
  }
};

// Get report summary with real emission data
const getReportSummary = async (userId = null) => {
  try {
    const activityData = await getActivityData(userId);
    const emissionFactors = await getEmissionFactors();
    
    // Calculate totals by scope
    const scopeTotals = { 'Scope 1': 0, 'Scope 2': 0, 'Scope 3': 0 };
    const activityBreakdown = {};
    
    for (const activity of activityData) {
      const factor = emissionFactors[activity.activity_type];
      if (factor) {
        const emission = activity.value * factor.factor;
        scopeTotals[factor.scope] = (scopeTotals[factor.scope] || 0) + emission;
        
        // Track by activity type
        if (!activityBreakdown[activity.activity_type]) {
          activityBreakdown[activity.activity_type] = { value: 0, emission: 0 };
        }
        activityBreakdown[activity.activity_type].value += parseFloat(activity.value);
        activityBreakdown[activity.activity_type].emission += emission;
      }
    }
    
    const totalEmissions = Object.values(scopeTotals).reduce((sum, v) => sum + v, 0);
    
    // Generate insights based on real data
    const insights = [
      { title: 'Total emissions', value: totalEmissions.toFixed(1), unit: 'tCO₂e' },
      { title: 'Total activities', value: activityData.length, unit: '' },
      { title: 'Scope 3 contribution', value: totalEmissions > 0 ? ((scopeTotals['Scope 3'] / totalEmissions) * 100).toFixed(0) + '%' : '0%', unit: '' },
    ];
    
    // Generate action items based on data
    const actionItems = [];
    if (scopeTotals['Scope 2'] > totalEmissions * 0.4) {
      actionItems.push('High Scope 2 emissions detected. Consider investing in renewable energy sources.');
    }
    if (scopeTotals['Scope 3'] > totalEmissions * 0.5) {
      actionItems.push('Scope 3 emissions are significant. Review supply chain sustainability.');
    }
    if (activityData.length < 5) {
      actionItems.push('Add more emission activities to get better insights and recommendations.');
    }
    if (actionItems.length === 0) {
      actionItems.push('Continue monitoring emissions to identify further reduction opportunities.');
      actionItems.push('Engage top suppliers on emission reduction targets.');
    }
    
    // Get current quarter
    const now = new Date();
    const quarter = Math.floor((now.getMonth() + 3) / 3);
    const timeframe = `Q${quarter} ${now.getFullYear()}`;
    
    const user = userId ? await getUserById(userId) : null;
    const company = user ? (user.name || user.email) : 'Global Aggregate';

    return {
      company,
      timeframe,
      totals: {
        'Scope 1': parseFloat(scopeTotals['Scope 1'].toFixed(2)),
        'Scope 2': parseFloat(scopeTotals['Scope 2'].toFixed(2)),
        'Scope 3': parseFloat(scopeTotals['Scope 3'].toFixed(2)),
      },
      totalEmissions: parseFloat(totalEmissions.toFixed(2)),
      insights,
      actionItems,
      activityBreakdown,
      lastUpdated: activityData.length > 0 ? activityData[0].created_at : null
    };
  } catch (error) {
    console.error('Error fetching report summary:', error);
    return {
      company: 'Global Aggregate',
      timeframe: 'Q1 2026',
      totals: { 'Scope 1': 0, 'Scope 2': 0, 'Scope 3': 0 },
      totalEmissions: 0,
      insights: [
        { title: 'Total emissions', value: '0', unit: 'tCO₂e' },
        { title: 'Total activities', value: '0', unit: '' },
      ],
      actionItems: ['Add emission activities to generate report insights.'],
      activityBreakdown: {}
    };
  }
};

module.exports = {
  getUsers,
  getUserByEmail,
  getUserById,
  createUser,
  verifyPassword,
  getEmissionFactors,
  getActivityData,
  getSuppliers,
  getAuditLogs,
  addActivity,
  addSupplier,
  addAuditLog,
  getEmissionTrends,
  getEmissionBreakdown,
  getAIPredictions,
  getDashboardSummary,
  getReportSummary
};