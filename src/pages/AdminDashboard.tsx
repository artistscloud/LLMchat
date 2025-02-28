import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import supabaseService from '../services/supabase';
import { Profile, ApiKey } from '../services/supabase';

const AdminDashboard: React.FC = () => {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<Profile[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'api-keys'>('users');
  
  // Form states for adding new API key
  const [newProvider, setNewProvider] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newEndpoint, setNewEndpoint] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Load users and API keys
  useEffect(() => {
    const loadData = async () => {
      // Load users
      setIsLoadingUsers(true);
      const { users: usersList, error: usersError } = await supabaseService.getAllUsers();
      
      if (!usersError && usersList) {
        setUsers(usersList);
      }
      
      setIsLoadingUsers(false);
      
      // Load API keys
      setIsLoadingKeys(true);
      const { apiKeys: keysList, error: keysError } = await supabaseService.getApiKeys();
      
      if (!keysError && keysList) {
        setApiKeys(keysList);
      }
      
      setIsLoadingKeys(false);
    };
    
    loadData();
  }, []);
  
  // Handle user role change
  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    const { error } = await supabaseService.updateUserRole(userId, newRole);
    
    if (!error) {
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
    }
  };
  
  // Handle API key toggle
  const handleKeyToggle = async (keyId: string, active: boolean) => {
    const { error } = await supabaseService.updateApiKey(keyId, { active });
    
    if (!error) {
      setApiKeys(apiKeys.map(k => 
        k.id === keyId ? { ...k, active } : k
      ));
    }
  };
  
  // Handle adding new API key
  const handleAddApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newProvider || !newKey) {
      setError('Provider and API key are required');
      return;
    }
    
    setError(null);
    
    try {
      const { apiKey, error } = await supabaseService.createApiKey(
        newProvider,
        newKey,
        newEndpoint || undefined
      );
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (apiKey) {
        setApiKeys([apiKey, ...apiKeys]);
        setSuccess(`API key for ${newProvider} added successfully`);
        
        // Reset form
        setNewProvider('');
        setNewKey('');
        setNewEndpoint('');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add API key');
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <Link
              to="/dashboard"
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`${
                activeTab === 'users'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('api-keys')}
              className={`${
                activeTab === 'api-keys'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              API Keys
            </button>
          </nav>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">User Management</h2>
            
            {isLoadingUsers ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading users...</p>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <li key={user.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-indigo-600 truncate">
                              {user.username}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {user.email}
                            </p>
                          </div>
                          <div className="ml-2 flex-shrink-0 flex">
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value as 'user' | 'admin')}
                              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                              disabled={user.id === profile?.id} // Can't change own role
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              Created: {formatDate(user.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* API Keys Tab */}
        {activeTab === 'api-keys' && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">API Key Management</h2>
            
            {/* Add new API key form */}
            <div className="bg-white shadow sm:rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Add New API Key
                </h3>
                
                {error && (
                  <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {success && (
                  <div className="mt-4 bg-green-50 border-l-4 border-green-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-green-700">{success}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <form onSubmit={handleAddApiKey} className="mt-5 space-y-4">
                  <div>
                    <label htmlFor="provider" className="block text-sm font-medium text-gray-700">
                      Provider
                    </label>
                    <select
                      id="provider"
                      name="provider"
                      value={newProvider}
                      onChange={(e) => setNewProvider(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      required
                    >
                      <option value="">Select a provider</option>
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="google">Google</option>
                      <option value="openrouter">OpenRouter</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="api-key" className="block text-sm font-medium text-gray-700">
                      API Key
                    </label>
                    <input
                      type="text"
                      name="api-key"
                      id="api-key"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Enter API key"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="endpoint" className="block text-sm font-medium text-gray-700">
                      Endpoint URL (optional)
                    </label>
                    <input
                      type="text"
                      name="endpoint"
                      id="endpoint"
                      value={newEndpoint}
                      onChange={(e) => setNewEndpoint(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Enter custom endpoint URL (if needed)"
                    />
                  </div>
                  
                  <div>
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Add API Key
                    </button>
                  </div>
                </form>
              </div>
            </div>
            
            {/* API Keys List */}
            {isLoadingKeys ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading API keys...</p>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {apiKeys.map((key) => (
                    <li key={key.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-indigo-600 truncate">
                              {key.provider}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {key.key.substring(0, 8)}...{key.key.substring(key.key.length - 4)}
                            </p>
                            {key.endpoint && (
                              <p className="text-xs text-gray-400 truncate mt-1">
                                Endpoint: {key.endpoint}
                              </p>
                            )}
                          </div>
                          <div className="ml-2 flex-shrink-0 flex">
                            <label className="inline-flex items-center">
                              <input
                                type="checkbox"
                                checked={key.active}
                                onChange={() => handleKeyToggle(key.id, !key.active)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700">
                                {key.active ? 'Active' : 'Inactive'}
                              </span>
                            </label>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              Created: {formatDate(key.created_at)}
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            {key.last_used && (
                              <p>
                                Last used: {formatDate(key.last_used)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
