import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Define types
interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  }[];
}

interface UsageData {
  totalChats: number;
  totalMessages: number;
  activeUsers: number;
  apiCalls: number;
  averageMessagesPerChat: number;
  popularLLMs: { name: string; count: number }[];
}

const Analytics: React.FC = () => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [usageData, setUsageData] = useState<UsageData>({
    totalChats: 0,
    totalMessages: 0,
    activeUsers: 0,
    apiCalls: 0,
    averageMessagesPerChat: 0,
    popularLLMs: []
  });
  
  // Load analytics data
  useEffect(() => {
    const loadAnalyticsData = async () => {
      setIsLoading(true);
      
      // In a real implementation, this would fetch data from the backend
      // For now, we'll use placeholder data
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set placeholder data based on time range
      const multiplier = timeRange === 'day' ? 1 : 
                         timeRange === 'week' ? 7 : 
                         timeRange === 'month' ? 30 : 365;
      
      setUsageData({
        totalChats: 156 * multiplier,
        totalMessages: 2834 * multiplier,
        activeUsers: 42 * Math.sqrt(multiplier),
        apiCalls: 3256 * multiplier,
        averageMessagesPerChat: 18,
        popularLLMs: [
          { name: 'ChatGPT', count: 423 * multiplier },
          { name: 'Claude', count: 387 * multiplier },
          { name: 'Gemini', count: 312 * multiplier },
          { name: 'Mistral', count: 201 * multiplier },
          { name: 'Llama', count: 156 * multiplier },
          { name: 'Grok', count: 134 * multiplier }
        ]
      });
      
      setIsLoading(false);
    };
    
    loadAnalyticsData();
  }, [timeRange]);
  
  // Handle logout
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  
  // Generate chart data
  const generateChartData = (): ChartData => {
    // In a real implementation, this would use real data
    // For now, we'll generate random data based on the time range
    
    let labels: string[] = [];
    const datasets = [
      {
        label: 'Chats',
        data: [] as number[],
        backgroundColor: 'rgba(52, 152, 219, 0.2)',
        borderColor: 'rgba(52, 152, 219, 1)',
        borderWidth: 1
      },
      {
        label: 'Messages',
        data: [] as number[],
        backgroundColor: 'rgba(46, 204, 113, 0.2)',
        borderColor: 'rgba(46, 204, 113, 1)',
        borderWidth: 1
      }
    ];
    
    // Generate labels and data based on time range
    if (timeRange === 'day') {
      // Hours of the day
      labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
      
      // Random data for each hour
      datasets[0].data = Array.from({ length: 24 }, () => Math.floor(Math.random() * 10));
      datasets[1].data = Array.from({ length: 24 }, () => Math.floor(Math.random() * 50 + 10));
    } else if (timeRange === 'week') {
      // Days of the week
      labels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      // Random data for each day
      datasets[0].data = Array.from({ length: 7 }, () => Math.floor(Math.random() * 30 + 5));
      datasets[1].data = Array.from({ length: 7 }, () => Math.floor(Math.random() * 200 + 50));
    } else if (timeRange === 'month') {
      // Days of the month
      labels = Array.from({ length: 30 }, (_, i) => `${i + 1}`);
      
      // Random data for each day
      datasets[0].data = Array.from({ length: 30 }, () => Math.floor(Math.random() * 20 + 2));
      datasets[1].data = Array.from({ length: 30 }, () => Math.floor(Math.random() * 150 + 20));
    } else {
      // Months of the year
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // Random data for each month
      datasets[0].data = Array.from({ length: 12 }, () => Math.floor(Math.random() * 500 + 100));
      datasets[1].data = Array.from({ length: 12 }, () => Math.floor(Math.random() * 3000 + 500));
    }
    
    return { labels, datasets };
  };
  
  // Chart data
  const chartData = generateChartData();
  
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
            <Link to="/admin" className="text-gray-600 hover:text-gray-800 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-primary-600">Analytics</h1>
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
        {/* Time range selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 md:mb-0">Usage Analytics</h2>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setTimeRange('day')}
                className={`px-4 py-2 rounded-md ${
                  timeRange === 'day'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                } transition`}
              >
                Day
              </button>
              <button
                onClick={() => setTimeRange('week')}
                className={`px-4 py-2 rounded-md ${
                  timeRange === 'week'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                } transition`}
              >
                Week
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={`px-4 py-2 rounded-md ${
                  timeRange === 'month'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                } transition`}
              >
                Month
              </button>
              <button
                onClick={() => setTimeRange('year')}
                className={`px-4 py-2 rounded-md ${
                  timeRange === 'year'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                } transition`}
              >
                Year
              </button>
            </div>
          </div>
          
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="text-blue-500 text-xl mb-2">{usageData.totalChats.toLocaleString()}</div>
              <div className="text-gray-800 font-medium">Total Chats</div>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <div className="text-green-500 text-xl mb-2">{usageData.totalMessages.toLocaleString()}</div>
              <div className="text-gray-800 font-medium">Total Messages</div>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <div className="text-purple-500 text-xl mb-2">{usageData.activeUsers.toLocaleString()}</div>
              <div className="text-gray-800 font-medium">Active Users</div>
            </div>
            <div className="bg-yellow-50 p-6 rounded-lg">
              <div className="text-yellow-500 text-xl mb-2">{usageData.apiCalls.toLocaleString()}</div>
              <div className="text-gray-800 font-medium">API Calls</div>
            </div>
          </div>
          
          {/* Chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Usage Over Time</h3>
            <div className="h-80 w-full">
              {/* In a real implementation, this would be a Chart.js component */}
              <div className="flex items-center justify-center h-full bg-gray-50 rounded-md">
                <p className="text-gray-500">
                  Chart would be displayed here in a real implementation.
                  <br />
                  Data: {JSON.stringify(chartData.labels)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Popular LLMs */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Popular LLMs</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {usageData.popularLLMs.map((llm, index) => (
                <div key={llm.name} className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{llm.name}</div>
                    <div className="text-gray-500">{llm.count.toLocaleString()} uses</div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-primary-600 h-2.5 rounded-full" 
                      style={{ 
                        width: `${(llm.count / usageData.popularLLMs[0].count) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* User Activity */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-6">User Activity</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chats
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Messages
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Favorite LLM
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Sample user data - would be real data in production */}
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-medium text-lg">J</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">John Doe</div>
                        <div className="text-sm text-gray-500">john.doe@example.com</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">24</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">342</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">2 hours ago</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">ChatGPT</div>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-medium text-lg">S</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">Sarah Johnson</div>
                        <div className="text-sm text-gray-500">sarah.j@example.com</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">18</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">256</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">5 hours ago</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Claude</div>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-medium text-lg">M</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">Mike Smith</div>
                        <div className="text-sm text-gray-500">mike.smith@example.com</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">32</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">487</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">1 day ago</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Gemini</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Export Options */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Export Data</h2>
          <div className="flex flex-wrap gap-4">
            <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export as CSV
            </button>
            <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export as JSON
            </button>
            <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export as PDF
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;
