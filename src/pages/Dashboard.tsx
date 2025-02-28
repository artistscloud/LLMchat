import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { llmModels } from '../services/llmService';

const Dashboard: React.FC = () => {
  const { user, profile, logout } = useAuth();
  const { chats, createNewChat, loadChat } = useChat();
  const navigate = useNavigate();
  
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [topic, setTopic] = useState('');
  const [selectedLLMs, setSelectedLLMs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const availableLLMs = Object.keys(llmModels);
  
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  
  const toggleLLM = (llm: string) => {
    if (selectedLLMs.includes(llm)) {
      setSelectedLLMs(selectedLLMs.filter(l => l !== llm));
    } else {
      setSelectedLLMs([...selectedLLMs, llm]);
    }
  };
  
  const handleCreateChat = async () => {
    if (!topic) {
      setError('Please enter a topic for the conversation');
      return;
    }
    
    if (selectedLLMs.length < 2) {
      setError('Please select at least 2 LLMs for the conversation');
      return;
    }
    
    setError(null);
    
    try {
      const { chatId, error } = await createNewChat(topic, selectedLLMs);
      
      if (error || !chatId) {
        throw new Error(error?.message || 'Failed to create chat');
      }
      
      // Navigate to the new chat
      navigate(`/chat/${chatId}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the chat');
    }
  };
  
  const handleChatClick = async (chatId: string) => {
    await loadChat(chatId);
    navigate(`/chat/${chatId}`);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">LLM Chat Arena</h1>
          <div className="flex items-center space-x-4">
            {profile?.role === 'admin' && (
              <Link
                to="/admin"
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Admin Panel
              </Link>
            )}
            <div className="text-sm text-gray-700">
              Logged in as <span className="font-medium">{profile?.username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Your Chats
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              type="button"
              onClick={() => setIsCreatingChat(!isCreatingChat)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isCreatingChat ? 'Cancel' : 'Create New Chat'}
            </button>
          </div>
        </div>

        {/* Create Chat Form */}
        {isCreatingChat && (
          <div className="bg-white shadow sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Create a New Chat
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
              
              <div className="mt-4">
                <label htmlFor="topic" className="block text-sm font-medium text-gray-700">
                  Topic
                </label>
                <input
                  type="text"
                  name="topic"
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter a topic for the conversation"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select LLMs (at least 2)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {availableLLMs.map((llm) => (
                    <div key={llm} className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id={`llm-${llm}`}
                          name={`llm-${llm}`}
                          type="checkbox"
                          checked={selectedLLMs.includes(llm)}
                          onChange={() => toggleLLM(llm)}
                          className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor={`llm-${llm}`} className="font-medium text-gray-700">
                          {llm}
                        </label>
                        <p className="text-gray-500">{llmModels[llm].description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleCreateChat}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create Chat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chats List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {chats.length === 0 ? (
            <div className="px-4 py-5 sm:p-6 text-center">
              <p className="text-gray-500">You don't have any chats yet. Create one to get started!</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {chats.map((chat) => (
                <li key={chat.id}>
                  <div
                    onClick={() => handleChatClick(chat.id)}
                    className="block hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            {chat.topic}
                          </p>
                          <div className={`ml-2 flex-shrink-0 flex ${
                            chat.status === 'active' ? 'text-green-500' :
                            chat.status === 'paused' ? 'text-yellow-500' : 'text-red-500'
                          }`}>
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {chat.status}
                            </span>
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 text-xs text-gray-500">
                            {formatDate(chat.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            Participants: {chat.llms.join(', ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
