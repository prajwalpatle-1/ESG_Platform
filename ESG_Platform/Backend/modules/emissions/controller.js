const { getActivityData } = require("../../data");

const {
  calculateEmission,
  addEmission,
  predictScope3Emission,
  detectScope3Anomalies
} = require("./service");

async function getAll(req, res) {
  try {
    const activityData = await getActivityData();
    const result = activityData.map(calculateEmission);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function create(req, res) {
  try {
    const record = await addEmission(req.body);
    res.json(record);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function predictScope3(req, res) {
  try {
    const { value } = req.body;
    const prediction = await predictScope3Emission(parseFloat(value));
    res.json({ predictedEmission: prediction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function getAnomalies(req, res) {
  try {
    const anomalies = await detectScope3Anomalies();
    res.json(anomalies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  getAll,
  create,
  predictScope3,
  getAnomalies
};