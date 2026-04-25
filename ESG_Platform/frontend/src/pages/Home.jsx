import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            ESG Management Platform
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Track, analyze, and reduce your environmental impact with our comprehensive ESG management solution.
          </p>
          {!user ? (
            <div className="space-x-4">
              <Link
                to="/login"
                className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                Get Started
              </Link>
              <Link
                to="/dashboard"
                className="bg-white text-green-600 px-8 py-3 rounded-lg border-2 border-green-600 hover:bg-green-50 transition-colors font-semibold"
              >
                View Demo
              </Link>
            </div>
          ) : (
            <div className="space-x-4">
              <Link
                to="/dashboard"
                className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                Go to Dashboard
              </Link>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Real-time Analytics</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Monitor your carbon footprint with interactive charts and comprehensive reporting.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">🌱</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Sustainability Tracking</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Track emissions across Scope 1, 2, and 3 with automated calculations and insights.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">🏢</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Supplier Management</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Manage supplier emissions and collaborate on sustainability goals.
            </p>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Welcome back!</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Role: <span className="font-semibold capitalize">{user.role}</span>
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              User ID: {user.id}
            </p>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-gray-500 dark:text-gray-400 mt-16">
          <p>&copy; 2026 ESG Management Platform. Building a sustainable future together.</p>
        </footer>
      </div>
    </div>
  );
}