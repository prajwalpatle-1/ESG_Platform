const { getEmissionFactors } = require("./data");

// Helper to get activity type key - use full type or try variations
function getActivityKey(activityType) {
  if (!activityType) return null;
  
  // First try direct match with the full activity_type
  return activityType;
}

async function calculateEmission(activity, emissionFactors) {
  const activityKey = getActivityKey(activity.activity_type);
  const factorData = emissionFactors[activityKey];

  if (!factorData) {
    // Try without scope prefix (e.g., "diesel" instead of "scope1_Diesel")
    const parts = activity.activity_type.split('_');
    if (parts.length >= 2) {
      const baseType = parts.slice(1).join('_').toLowerCase();
      const directMatch = Object.keys(emissionFactors).find(k => 
        k.toLowerCase().includes(baseType)
      );
      if (directMatch) {
        const matchedFactor = emissionFactors[directMatch];
        const emission = activity.value * matchedFactor.factor;
        return {
          ...activity,
          emission: emission,
          scope: matchedFactor.scope
        };
      }
    }
    console.log(`No factor found for activity_type: ${activity.activity_type}`);
    return null;
  }

  const emission = activity.value * factorData.factor;

  return {
    ...activity,
    emission: emission,
    scope: factorData.scope
  };
}

async function calculateAll(data) {
  const emissionFactors = await getEmissionFactors();
  return await Promise.all(data.map(item => calculateEmission(item, emissionFactors)));
}

function calculateTotals(records) {
  let totals = {
    "Scope 1": 0,
    "Scope 2": 0,
    "Scope 3": 0
  };

  records.forEach(r => {
    if (r) totals[r.scope] += r.emission;
  });

  return totals;
}

module.exports = {
  calculateAll,
  calculateTotals
};