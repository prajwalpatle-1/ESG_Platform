const express = require("express");
const { login, signup } = require("./modules/auth/controller");
const verifyToken = require("./middleware/auth");
const authorize = require("./middleware/roles");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pool = require("./config/db");

const router = express.Router();

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

const { 
  getActivityData, 
  getSuppliers, 
  getEmissionFactors, 
  addActivity, 
  addSupplier, 
  addAuditLog,
  getUsers,
  getEmissionTrends,
  getEmissionBreakdown,
  getAIPredictions,
  getDashboardSummary,
  getReportSummary
} = require("./data");

const {
 calculateAll,
 calculateTotals
} = require("./ghgEngine");

// auth routes
router.post("/login", login);
router.post("/signup", signup);

// protected routes
// dashboard data - requires authentication
// dashboard data - requires authentication
router.get("/dashboard", verifyToken, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const targetUserId = isAdmin && req.query.userId ? req.query.userId : (isAdmin ? null : req.user.id);

    const activityData = await getActivityData(targetUserId);
    const calculated = await calculateAll(activityData);
    const totals = calculateTotals(calculated);
    const dashboardSummary = await getDashboardSummary(targetUserId);

    res.json({
      company: dashboardSummary.company,
      records: calculated,
      totals,
      activityCount: dashboardSummary.activityCount,
      lastUpdated: dashboardSummary.lastUpdated
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/activities", verifyToken, async (req, res) => {
  try {
    const activity = await addActivity(req.body, req.user.id);
    const io = req.app.get('io');
    io.emit('activityAdded', activity);
    await addAuditLog({ action: 'add_activity', user_id: req.user.id, details: JSON.stringify(activity) });
    res.json(activity);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==========================================
// ESG FILE UPLOAD ROUTES
// ==========================================

// 1. Upload a new file
router.post("/upload", verifyToken, upload.single("file"), async (req, res) => {
  console.log("Did we get a file?", req.file ? "YES" : "NO");
  console.log("Token used:", req.headers.authorization);
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileName = req.file.originalname;
    const filePath = req.file.path;
    const uploadedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

    // Insert into PostgreSQL
    const insertQuery = `
      INSERT INTO file_uploads (name, uploaded, status, details, file_path, user_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [fileName, uploadedDate, 'Pending', 'Uploaded via ESG dashboard.', filePath, req.user.id];

    const result = await pool.query(insertQuery, values);
    const newRecord = result.rows[0];

    // Emit Socket.IO event so other connected admins see the upload instantly!
    const io = req.app.get('io');
    if (io) {
      io.emit('fileUploaded', newRecord);
    }

    res.status(201).json({ message: "File uploaded successfully", newRecord });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: "Internal server error during upload" });
  }
});

// 2. Get upload history (FILTERED BY ROLE)
router.get("/files", verifyToken, async (req, res) => {
  try {
    let query = '';
    let values = [];

    // Check the role of the person making the request
    if (req.user.role === 'admin') {
      // Admins get everything
      query = 'SELECT * FROM file_uploads ORDER BY id DESC';
    } else {
      // Standard users only get their own files
      query = 'SELECT * FROM file_uploads WHERE user_id = $1 ORDER BY id DESC';
      values = [req.user.id];
    }

    const result = await pool.query(query, values);
    res.json(result.rows);

  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ message: "Internal server error fetching files" });
  }
});

// supplier data - admin only
router.get("/suppliers", verifyToken, authorize(["admin"]), async (req, res) => {
  try {
    const suppliers = await getSuppliers();
    res.json(suppliers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/users/list", verifyToken, authorize(["admin"]), async (req, res) => {
  try {
    const users = await getUsers();
    res.json(users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/suppliers", verifyToken, authorize(["admin"]), async (req, res) => {
  try {
    const supplier = await addSupplier(req.body);
    const io = req.app.get('io');
    io.emit('supplierAdded', supplier);
    await addAuditLog({ action: 'add_supplier', user_id: req.user.id, details: JSON.stringify(supplier) });
    res.json(supplier);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});


// scenario simulation
router.post("/scenario", verifyToken, async (req, res) => {
  try {
    const { percent, scenarioId } = req.body; // Grab both values!
    const activityData = await getActivityData();
    const emissionFactors = await getEmissionFactors();

    let targetActivity;
    let keyword;

    // 1. DETERMINE WHICH DATA TO LOOK FOR
    if (scenarioId === 1) {
      // Scenario 1: Renewable Energy (Scope 2 / Electricity)
      keyword = 'electricity';
    } else if (scenarioId === 2) {
      // Scenario 2: Efficiency Upgrade (Scope 1 / Fuel)
      keyword = 'scope1'; 
    } else {
      return res.status(400).json({ message: "Unknown scenario selected." });
    }

    // 2. FIND THE DATA & FACTOR
    targetActivity = activityData.find(
      d => d.activity_type && d.activity_type.toLowerCase().includes(keyword)
    );
    if (!targetActivity) {
      return res.status(400).json({ message: `No ${keyword} data found in your activities.` });
    }

    let factor = null;
    if (emissionFactors[targetActivity.activity_type]) {
      factor = emissionFactors[targetActivity.activity_type].factor;
    } else {
      const matchingKey = Object.keys(emissionFactors).find(key => 
        key.toLowerCase().includes(keyword)
      );
      if (matchingKey) factor = emissionFactors[matchingKey].factor;
    }

    if (!factor) {
      return res.status(400).json({ 
        message: `Missing emission factor for '${targetActivity.activity_type}'.` 
      });
    }

    // 3. CALCULATE THE REDUCTION
    const currentEmission = targetActivity.value * factor;
    
    const reductionAmount = currentEmission * (percent / 100);
    const newTotal = currentEmission - reductionAmount;

    res.json({
      emissionReduction: Math.round(reductionAmount),
      newTotal: Math.round(newTotal)
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error during simulation" });
  }
});


// report
router.get("/report", verifyToken, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const targetUserId = req.query.userId;

    let userIdToFetch = null;

    if (!isAdmin) {
      userIdToFetch = req.user.id;
    } else if (isAdmin && targetUserId) {
      userIdToFetch = targetUserId;
    }
    
    const reportData = await getReportSummary(userIdToFetch);

    res.json(reportData);
  } catch (error) {
    console.error("Report Fetch Error:", error);;
    res.status(500).json({ message: "Internal server error" });
  }
});

// notifications
const { getNotifications, markAsRead, clearNotifications, notify } = require("./modules/notifications/service");

router.get("/notifications", (req, res) => {
 res.json(getNotifications());
});

router.post("/notifications", (req, res) => {
 const { message } = req.body;
 if (!message) return res.status(400).json({ error: "Message required" });
 const notification = notify(message);
 res.json(notification);
});

router.put("/notifications/:id/read", (req, res) => {
 const notification = markAsRead(parseInt(req.params.id));
 if (notification) {
  res.json(notification);
 } else {
  res.status(404).json({ error: "Notification not found" });
 }
});

router.delete("/notifications", (req, res) => {
 clearNotifications();
 res.json({ message: "Notifications cleared" });
});

// emissions AI endpoints
const { predictScope3, getAnomalies } = require("./modules/emissions/controller");

router.post("/emissions/predict-scope3", verifyToken, predictScope3);
router.get("/emissions/anomalies", verifyToken, getAnomalies);

// Dashboard analytics endpoints
router.get("/dashboard/emissions-trends", verifyToken, async (req, res) => {
  try {
    const { year, userId } = req.query;
    const isAdmin = req.user.role === 'admin';
    const userIdToFetch = isAdmin ? (userId || null) : req.user.id;

    const trends = await getEmissionTrends(year, userIdToFetch);
    const emissionFactors = await getEmissionFactors();
    
    // Transform data for frontend
    const monthlyData = {};
    trends.forEach(row => {
      if (!monthlyData[row.month]) {
        monthlyData[row.month] = { emission: 0, scope1: 0, scope2: 0, scope3: 0, count: 0 };
      }
      const factor = emissionFactors[row.activity_type];
      if (factor) {
        const emission = row.total_value * factor.factor;
        monthlyData[row.month].emission += emission;
        monthlyData[row.month][factor.scope.toLowerCase().replace(' ', '')] += emission;
        monthlyData[row.month].count += parseInt(row.activity_count);
      }
    });
    
    const formattedData = Object.entries(monthlyData).map(([month, data]) => ({
      date: month,
      emission: Math.round(data.emission * 100) / 100,
      scope1: Math.round(data.scope1 * 100) / 100,
      scope2: Math.round(data.scope2 * 100) / 100,
      scope3: Math.round(data.scope3 * 100) / 100,
      count: data.count
    }));
    
    res.json(formattedData);
  } catch (error) {
    console.error('Error fetching emission trends:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/dashboard/emissions-breakdown", verifyToken, async (req, res) => {
  try {
    const { userId } = req.query;
    const isAdmin = req.user.role === 'admin';
    const userIdToFetch = isAdmin ? (userId || null) : req.user.id;

    const breakdown = await getEmissionBreakdown(userIdToFetch);
    
    // Group by scope
    const scopeGroups = {};
    breakdown.forEach(row => {
      if (!scopeGroups[row.scope]) {
        scopeGroups[row.scope] = [];
      }
      scopeGroups[row.scope].push({
        name: row.activity_type,
        value: Math.round(parseFloat(row.total_emission) * 100) / 100,
        color: getScopeColor(row.scope, scopeGroups[row.scope].length)
      });
    });
    
    // Flatten for pie chart
    const pieData = [];
    Object.entries(scopeGroups).forEach(([scope, items]) => {
      items.forEach(item => pieData.push(item));
    });
    
    res.json(pieData);
  } catch (error) {
    console.error('Error fetching emission breakdown:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/dashboard/ai-predictions", verifyToken, async (req, res) => {
  try {
    const { userId } = req.query;
    const isAdmin = req.user.role === 'admin';
    const userIdToFetch = isAdmin ? (userId || null) : req.user.id;

    const predictions = await getAIPredictions(userIdToFetch);
    
    // Calculate simple linear trend for next month prediction
    if (predictions.length >= 2) {
      const values = predictions.map(p => parseFloat(p.total_value));
      const avgGrowth = (values[0] - values[values.length - 1]) / values.length;
      const lastValue = values[0];
      const predicted = lastValue + avgGrowth;
      
      res.json({
        historical: predictions.map(p => ({
          month: p.month,
          value: parseFloat(p.total_value),
          count: parseInt(p.activity_count)
        })),
        predicted: {
          month: 'Next Month',
          value: Math.round(predicted * 100) / 100,
          confidence: 'medium'
        },
        trend: avgGrowth > 0 ? 'increasing' : 'decreasing',
        trendPercent: Math.round(Math.abs(avgGrowth / lastValue * 100) * 100) / 100
      });
    } else {
      res.json({
        historical: predictions,
        predicted: null,
        trend: 'insufficient_data',
        trendPercent: 0
      });
    }
  } catch (error) {
    console.error('Error fetching AI predictions:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Helper function for scope colors
function getScopeColor(scope, index) {
  const colors = {
    'Scope 1': ['#0088FE', '#0056b3'],
    'Scope 2': ['#00C49F', '#00896b'],
    'Scope 3': ['#FFBB28', '#cc9200']
  };
  return colors[scope]?.[index] || '#888888';
}

// Get emission factors for use in endpoints
let emissionFactors = {};
getEmissionFactors().then(factors => {
  emissionFactors = factors;
});

module.exports = router;