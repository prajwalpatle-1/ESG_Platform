import axios from "axios";
import io from "socket.io-client";

//  Create a centralized Axios instance
const apiClient = axios.create({
  baseURL: "http://localhost:5000/api",
});


apiClient.interceptors.request.use(
  (config) => {
    let token = localStorage.getItem("token");
    
    if (token) {
      token = token.replace(/"/g, ""); 
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Socket Connection
export const socket = io("http://localhost:5000");

// API ENDPOINTS (Now using apiClient!)

export const getDashboard = (userId = null) => {
  const params = userId ? { userId } : {};
  return apiClient.get(`/dashboard`, { params });
};

export const getSuppliers = () => apiClient.get(`/suppliers`);

export const simulateScenario = (percent, scenarioId) =>
  apiClient.post(`/scenario`, { percent, scenarioId });

export const getReport = (userId = null) => {
  const params = userId ? { userId } : {};
  return apiClient.get(`/report`, { params });
};
export const getUsersList = () => apiClient.get(`/users/list`);

export const addActivity = (activity) =>
  apiClient.post(`/activities`, activity);

export const addSupplier = (supplier) =>
  apiClient.post(`/suppliers`, supplier);

export const predictScope3Emission = (value) =>
  apiClient.post(`/emissions/predict-scope3`, { value });

export const getEmissionAnomalies = () =>
  apiClient.get(`/emissions/anomalies`);

// Dashboard analytics API
export const getEmissionTrends = (userId, year) => 
  apiClient.get(`/dashboard/emissions-trends`, { params: { userId, year } });

export const getEmissionBreakdown = (userId) => 
  apiClient.get(`/dashboard/emissions-breakdown`, { params: { userId } });

export const getAIPredictions = (userId) => 
  apiClient.get(`/dashboard/ai-predictions`, { params: { userId } });