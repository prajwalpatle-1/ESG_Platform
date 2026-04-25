import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import Notifications from './Notifications';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/emissions', label: 'Emissions', icon: '🌱' },
    { path: '/upload', label: 'Upload', icon: '📁' },
    { path: '/scenario', label: 'Scenario', icon: '🔮' },
    { path: '/suppliers', label: 'Suppliers', icon: '🏢', roles: ['admin'] },
    { path: '/report', label: 'Report', icon: '📋' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const filteredNavItems = navItems.filter(item => !item.roles || item.roles.includes(user?.role));

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex`}>
      {/* Sidebar */}
      <div className={`w-64 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <div className="p-6">
          <Link to="/" className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-700'} hover:opacity-80`}>
            ESG Platform
          </Link>
        </div>
        <nav className="mt-6">
          {filteredNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-6 py-3 ${darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-green-50 hover:text-green-700'} transition-colors ${
                location.pathname === item.path ? `${darkMode ? 'bg-gray-700 text-white' : 'bg-green-100 text-green-800'} border-r-4 border-green-700` : ''
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className={`shadow-sm px-6 py-4 flex justify-between items-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            {filteredNavItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
          </h2>
          <div className="flex items-center space-x-4">
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Welcome, {user?.email} ({user?.role})
            </span>
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-200 text-gray-800'} hover:opacity-80 transition-opacity`}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <Notifications />
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}