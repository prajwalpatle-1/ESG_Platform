const pool = require("../../config/db");
const { v4: uuid } = require("uuid");
const { trainModel, predictEmission } = require("../ai/predict");
const { trainAnomalyModel, detectAnomaly } = require("../ai/anamoly");

let scope3Model = null;
let anomalyModel = null;

// Initialize AI models on startup
async function initializeAIModels() {
  try {
    // Get all scope 3 activities (handle various formats)
    const result = await pool.query('SELECT * FROM activities WHERE activity_type LIKE \'scope3%\' OR activity_type IN (\'flight\', \'logistics\', \'supplier\')');
    
    const scope3Data = result.rows.map(row => ({
      value: parseFloat(row.value),
      emission: parseFloat(row.value) * 0.15, // Approximate emission calculation
      scope: 'Scope 3'
    }));

    if (scope3Data.length > 0) {
      scope3Model = await trainModel(scope3Data);
      anomalyModel = await trainAnomalyModel(scope3Data);
      console.log('AI models initialized with', scope3Data.length, 'records');
    } else {
      console.log('No scope 3 data found for AI model initialization');
    }
  } catch (error) {
    console.error('Error initializing AI models:', error);
  }
}

// Call initialization
initializeAIModels();

async function predictScope3Emission(value) {
  if (!scope3Model) {
    // Fallback to simple calculation
    return value * 0.15;
  }
  return await predictEmission(scope3Model, value, 'Scope 3');
}

async function detectScope3Anomalies() {
  try {
    // Get all scope 3 activities (handle various formats)
    const result = await pool.query('SELECT * FROM activities WHERE activity_type LIKE \'scope3%\' OR activity_type IN (\'flight\', \'logistics\', \'supplier\')');
    
    if (result.rows.length === 0) {
      return [];
    }

    const data = result.rows.map(row => ({
      emission: parseFloat(row.value) * 0.15,
      value: parseFloat(row.value),
      activity_type: row.activity_type
    }));

    if (!anomalyModel || data.length === 0) {
      return [];
    }

    return await detectAnomaly(data, anomalyModel);
  } catch (error) {
    console.error('Error detecting anomalies:', error);
    return [];
  }
}

async function createEmission({
  company_id,
  activity_type,
  value,
  scope,
  emission
}) {
  const result = await pool.query(
    `
    INSERT INTO emissions
    VALUES
    (
     $1,$2,$3,$4,$5,$6,now()
    )
    RETURNING *
    `,
    [
     uuid(),
     company_id,
     activity_type,
     value,
     scope,
     emission
    ]
  );

  return result.rows[0];
}

async function getCompanyData(company_id) {
  const result = await pool.query(
    `
    SELECT *
    FROM emissions
    WHERE company_id=$1
    `,
    [company_id]
  );

  return result.rows;
}

module.exports = {
  createEmission,
  getCompanyData,
  predictScope3Emission,
  detectScope3Anomalies,
  initializeAIModels
};