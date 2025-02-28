import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAllUsers, getApiKeys } from '../../services/supabase';

// Define types
interface UserStats {
  totalUsers: number;
  newUsersToday: number;
  activeUsersToday: number;
}

interface ChatStats {
  totalChats: number;
  chatsToday: number;
  averageMessagesPerChat: number;
}

interface ApiKeyStats {
  totalApiKeys: number;
  activeApiKeys: number;
}

const AdminDashboard: React.FC = () => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    newUsersToday: 0,
    activeUsersToday: 0
  });
  const [chatStats, setChatStats] = useState<ChatStats>({
    totalChats: 0,
    chatsToday: 0,
    averageMessagesPerChat: 0
  });
  const [apiKeyStats, setApiKeyStats] = useState<ApiKeyStats>({
    totalApiKeys: 0,
    activeApiKeys: 0
  });
  
  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      
      try {
        // Get users data
        const { users } = await getAllUsers();
        
        if (users) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const newUsersToday = users.filter(user => {
            const createdAt = new Date(user.created_at);
            return createdAt >= today;
          }).length;
          
          setUserStats({
            totalUsers: users.length,
            newUsersToday,
            activeUsersToday: Math.floor(users.length * 0.3) // Placeholder, would be real data in production
          });
        }
        
        // Get API keys data
        const { apiKeys } = await getApiKeys();
        
        if (apiKeys) {
          setApiKeyStats({
            totalApiKeys: apiKeys.length,
            activeApiKeys: apiKeys.filter(key => key.active).length
          });
        }
        
        // Placeholder chat stats (would be real data in production)
        setChatStats({
          totalChats: 156,
          chatsToday: 23,
          averageMessagesPerChat: 18
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
      
      setIsLoading(false);
    };
    
    loadDashboardData();
  }, []);
  
  // Handle logout
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-primary-600">Admin Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {profile && (
              <div className="text-sm text-gray-600">
                Welcome, <span className="font-medium">{profile.username}</span>
              </div>
            )}
            
            <Link to="/dashboard" className="text-sm text-primary-600 hover:text-primary-800">
              User Dashboard
            </Link>
            
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* User Stats Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">User Statistics</h2>
              <div className="p-2 bg-blue-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">Total Users</div>
                <div className="text-2xl font-bold">{userStats.totalUsers}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">New Users Today</div>
                <div className="text-2xl font-bold">{userStats.newUsersToday}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Active Users Today</div>
                <div className="text-2xl font-bold">{userStats.activeUsersToday}</div>
              </div>
            </div>
            <div className="mt-6">
              <Link to="/admin/users" className="text-primary-600 hover:text-primary-800 text-sm font-medium">
                View All Users →
              </Link>
            </div>
          </div>
          
          {/* Chat Stats Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Chat Statistics</h2>
              <div className="p-2 bg-green-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">Total Chats</div>
                <div className="text-2xl font-bold">{chatStats.totalChats}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Chats Today</div>
                <div className="text-2xl font-bold">{chatStats.chatsToday}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Avg. Messages Per Chat</div>
                <div className="text-2xl font-bold">{chatStats.averageMessagesPerChat}</div>
              </div>
            </div>
            <div className="mt-6">
              <Link to="/admin/analytics" className="text-primary-600 hover:text-primary-800 text-sm font-medium">
                View Analytics →
              </Link>
            </div>
          </div>
          
          {/* API Key Stats Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">API Key Statistics</h2>
              <div className="p-2 bg-purple-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">Total API Keys</div>
                <div className="text-2xl font-bold">{apiKeyStats.totalApiKeys}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Active API Keys</div>
                <div className="text-2xl font-bold">{apiKeyStats.activeApiKeys}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">API Providers</div>
                <div className="text-2xl font-bold">6</div>
              </div>
            </div>
            <div className="mt-6">
              <Link to="/admin/api-keys" className="text-primary-600 hover:text-primary-800 text-sm font-medium">
                Manage API Keys →
              </Link>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/admin/users"
              className="flex items-center p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition"
            >
              <div className="p-2 bg-blue-100 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <div className="font-medium">Add New User</div>
                <div className="text-sm text-gray-500">Create a new user account</div>
              </div>
            </Link>
            <Link
              to="/admin/api-keys"
              className="flex items-center p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition"
            >
              <div className="p-2 bg-purple-100 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <div className="font-medium">Add API Key</div>
                <div className="text-sm text-gray-500">Configure a new API key</div>
              </div>
            </Link>
            <Link
              to="/admin/analytics"
              className="flex items-center p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition"
            >
              <div className="p-2 bg-green-100 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <div className="font-medium">View Reports</div>
                <div className="text-sm text-gray-500">Check usage analytics</div>
              </div>
            </Link>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Sample activity data - would be real data in production */}
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">New User Registration</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">sarah.johnson</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">10 minutes ago</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Completed registration process
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">API Key Added</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">admin</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">1 hour ago</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Added new OpenAI API key
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">Chat Created</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">john.doe</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">2 hours ago</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Created chat with ChatGPT, Claude, and Gemini
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">User Role Updated</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">mike.smith</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">3 hours ago</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Changed from user to admin
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
