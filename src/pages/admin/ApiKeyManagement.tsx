import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getApiKeys, createApiKey, updateApiKey } from '../../services/supabase';

// Define types
interface ApiKey {
  id: string;
  provider: string;
  key: string;
  endpoint?: string;
  active: boolean;
  created_at: string;
  last_used?: string;
}

const ApiKeyManagement: React.FC = () => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAddKeyModal, setShowAddKeyModal] = useState<boolean>(false);
  const [newApiKey, setNewApiKey] = useState({
    provider: 'openai',
    key: '',
    endpoint: '',
  });
  const [error, setError] = useState<string | null>(null);
  
  // Provider options
  const providers = [
    { id: 'openai', name: 'OpenAI (ChatGPT)', requiresEndpoint: false },
    { id: 'anthropic', name: 'Anthropic (Claude)', requiresEndpoint: false },
    { id: 'google', name: 'Google (Gemini)', requiresEndpoint: false },
    { id: 'openrouter', name: 'OpenRouter (Grok, Mistral, Llama)', requiresEndpoint: false },
    { id: 'custom', name: 'Custom Provider', requiresEndpoint: true },
  ];
  
  // Load API keys
  useEffect(() => {
    const loadApiKeys = async () => {
      setIsLoading(true);
      
      try {
        const { apiKeys: keys } = await getApiKeys();
        
        if (keys) {
          setApiKeys(keys as ApiKey[]);
        }
      } catch (error) {
        console.error('Error loading API keys:', error);
      }
      
      setIsLoading(false);
    };
    
    loadApiKeys();
  }, []);
  
  // Handle logout
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  
  // Handle toggle API key active state
  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await updateApiKey(id, { active: !currentActive });
      
      // Update local state
      setApiKeys(apiKeys.map(key => {
        if (key.id === id) {
          return { ...key, active: !currentActive };
        }
        return key;
      }));
    } catch (error) {
      console.error('Error updating API key:', error);
    }
  };
  
  // Handle add API key
  const handleAddApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newApiKey.provider || !newApiKey.key) {
      setError('Please fill in all required fields');
      return;
    }
    
    // Check if endpoint is required but not provided
    const selectedProvider = providers.find(p => p.id === newApiKey.provider);
    if (selectedProvider?.requiresEndpoint && !newApiKey.endpoint) {
      setError('Endpoint is required for this provider');
      return;
    }
    
    setError(null);
    
    try {
      const { apiKey, error } = await createApiKey(
        newApiKey.provider,
        newApiKey.key,
        newApiKey.endpoint || undefined
      );
      
      if (error) {
        setError(error.message);
        return;
      }
      
      if (apiKey) {
        // Add to local state
        setApiKeys([
          {
            ...apiKey,
            active: true,
            created_at: new Date().toISOString()
          } as ApiKey,
          ...apiKeys
        ]);
        
        setShowAddKeyModal(false);
        setNewApiKey({
          provider: 'openai',
          key: '',
          endpoint: '',
        });
      }
    } catch (error: any) {
      setError(error.message || 'Failed to add API key');
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Mask API key
  const maskApiKey = (key: string) => {
    if (key.length <= 8) return '••••••••';
    return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
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
            <Link to="/admin" className="text-gray-600 hover:text-gray-800 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-primary-600">API Key Management</h1>
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
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-1">API Keys</h2>
              <p className="text-sm text-gray-500">Manage API keys for different LLM providers</p>
            </div>
            
            <button
              onClick={() => setShowAddKeyModal(true)}
              className="mt-4 md:mt-0 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add API Key
            </button>
          </div>
          
          {/* API Keys Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    API Key
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Endpoint
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {apiKeys.map(apiKey => (
                  <tr key={apiKey.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-medium text-lg">
                            {apiKey.provider.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {providers.find(p => p.id === apiKey.provider)?.name || apiKey.provider}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono">{maskApiKey(apiKey.key)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {apiKey.endpoint ? (
                          <span className="font-mono text-xs">{apiKey.endpoint}</span>
                        ) : (
                          <span className="text-gray-400">Default</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(apiKey.created_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        apiKey.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {apiKey.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleToggleActive(apiKey.id, apiKey.active)}
                          className={`${
                            apiKey.active 
                              ? 'text-red-600 hover:text-red-800' 
                              : 'text-green-600 hover:text-green-800'
                          }`}
                        >
                          {apiKey.active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button className="text-primary-600 hover:text-primary-800">
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {apiKeys.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No API keys found. Add your first API key to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* API Key Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">API Key Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-4 rounded-md">
              <h3 className="font-bold text-blue-800 mb-2">OpenAI (ChatGPT)</h3>
              <p className="text-sm text-gray-700 mb-2">
                Get your API key from the <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">OpenAI dashboard</a>.
              </p>
              <p className="text-sm text-gray-700">
                Recommended models: gpt-4, gpt-3.5-turbo
              </p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-md">
              <h3 className="font-bold text-purple-800 mb-2">Anthropic (Claude)</h3>
              <p className="text-sm text-gray-700 mb-2">
                Get your API key from the <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-800">Anthropic console</a>.
              </p>
              <p className="text-sm text-gray-700">
                Recommended models: claude-3-opus, claude-3-sonnet
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-md">
              <h3 className="font-bold text-green-800 mb-2">Google (Gemini)</h3>
              <p className="text-sm text-gray-700 mb-2">
                Get your API key from the <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800">Google AI Studio</a>.
              </p>
              <p className="text-sm text-gray-700">
                Recommended models: gemini-pro
              </p>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-md">
              <h3 className="font-bold text-orange-800 mb-2">OpenRouter</h3>
              <p className="text-sm text-gray-700 mb-2">
                Get your API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-800">OpenRouter</a> to access Grok, Mistral, and Llama models.
              </p>
              <p className="text-sm text-gray-700">
                Provides access to multiple models through a single API.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      {/* Add API Key Modal */}
      {showAddKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Add New API Key</h3>
                <button
                  onClick={() => setShowAddKeyModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleAddApiKey}>
                <div className="mb-4">
                  <label htmlFor="provider" className="block text-gray-700 font-medium mb-2">
                    Provider <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="provider"
                    value={newApiKey.provider}
                    onChange={(e) => setNewApiKey({ ...newApiKey, provider: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    {providers.map(provider => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="apiKey" className="block text-gray-700 font-medium mb-2">
                    API Key <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    id="apiKey"
                    value={newApiKey.key}
                    onChange={(e) => setNewApiKey({ ...newApiKey, key: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="sk-..."
                    required
                  />
                </div>
                
                {providers.find(p => p.id === newApiKey.provider)?.requiresEndpoint && (
                  <div className="mb-4">
                    <label htmlFor="endpoint" className="block text-gray-700 font-medium mb-2">
                      API Endpoint <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="endpoint"
                      value={newApiKey.endpoint}
                      onChange={(e) => setNewApiKey({ ...newApiKey, endpoint: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="https://api.example.com/v1"
                      required={providers.find(p => p.id === newApiKey.provider)?.requiresEndpoint}
                    />
                  </div>
                )}
                
                <div className="bg-yellow-50 p-3 rounded-md mb-6">
                  <p className="text-sm text-yellow-800">
                    <span className="font-bold">Security Note:</span> API keys are stored securely and encrypted. Never share your API keys with others.
                  </p>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddKeyModal(false)}
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition mr-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition"
                  >
                    Add API Key
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeyManagement;
