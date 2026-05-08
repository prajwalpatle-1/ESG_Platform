import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from "./components/Layout";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const EmissionForm = lazy(() => import("./components/EmissionForm"));
const UploadExcel = lazy(() => import("./components/UploadExcel"));
const Scenario = lazy(() => import("./pages/Scenario"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const Report = lazy(() => import("./pages/Report"));
const CompanyReports = lazy(() => import("./pages/CompanyReports"));

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <Router>
            <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div></div>}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/emissions" element={
                  <ProtectedRoute>
                    <Layout>
                      <EmissionForm />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/upload" element={
                  <ProtectedRoute>
                    <Layout>
                      <UploadExcel />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/scenario" element={
                  <ProtectedRoute>
                    <Layout>
                      <Scenario />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/suppliers" element={
                  <ProtectedRoute roles={['admin']}>
                    <Layout>
                      <Suppliers />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/company-reports" element={
                  <ProtectedRoute roles={['admin']}>
                    <Layout>
                      <CompanyReports />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/report" element={
                  <ProtectedRoute>
                    <Layout>
                      <Report />
                    </Layout>
                  </ProtectedRoute>
                } />
              </Routes>
            </Suspense>
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;