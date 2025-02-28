import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

// Define types
interface LLMOption {
  id: string;
  name: string;
  description: string;
  logo?: string;
}

const Dashboard: React.FC = () => {
  const { user, profile, logout } = useAuth();
  const { chats, createNewChat, isLoading } = useChat();
  const navigate = useNavigate();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [topic, setTopic] = useState('');
  const [selectedLLMs, setSelectedLLMs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // LLM options
  const llmOptions: LLMOption[] = [
    {
      id: 'ChatGPT',
      name: 'ChatGPT',
      description: 'OpenAI\'s powerful language model known for detailed explanations.',
      logo: '🤖'
    },
    {
      id: 'Claude',
      name: 'Claude',
      description: 'Anthropic\'s thoughtful AI with nuanced analysis capabilities.',
      logo: '🧠'
    },
    {
      id: 'Gemini',
      name: 'Gemini',
      description: 'Google\'s model with strong factual knowledge and pattern recognition.',
      logo: '🌐'
    },
    {
      id: 'Grok',
      name: 'Grok',
      description: 'xAI\'s witty and rebellious AI with unique perspectives.',
      logo: '⚡'
    },
    {
      id: 'Mistral',
      name: 'Mistral',
      description: 'Efficient open-weight model with elegant responses.',
      logo: '🌀'
    },
    {
      id: 'Llama',
      name: 'Llama',
      description: 'Meta\'s versatile and adaptable open model.',
      logo: '🦙'
    }
  ];
  
  // Handle LLM selection
  const toggleLLM = (llmId: string) => {
    if (selectedLLMs.includes(llmId)) {
      setSelectedLLMs(selectedLLMs.filter(id => id !== llmId));
    } else {
      // Limit to 3 LLMs
      if (selectedLLMs.length < 3) {
        setSelectedLLMs([...selectedLLMs, llmId]);
      }
    }
  };
  
  // Handle create chat
  const handleCreateChat = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }
    
    if (selectedLLMs.length < 2) {
      setError('Please select at least 2 LLMs');
      return;
    }
    
    setError(null);
    
    const { chatId, error } = await createNewChat(topic, selectedLLMs);
    
    if (error) {
      setError(error.message || 'Failed to create chat');
      return;
    }
    
    if (chatId) {
      setShowCreateModal(false);
      setTopic('');
      setSelectedLLMs([]);
      navigate(`/chat/${chatId}`);
    }
  };
  
  // Handle logout
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600">LLM Chat Arena</h1>
          
          <div className="flex items-center space-x-4">
            {profile && (
              <div className="text-sm text-gray-600">
                Welcome, <span className="font-medium">{profile.username}</span>
              </div>
            )}
            
            {profile?.role === 'admin' && (
              <Link to="/admin" className="text-sm text-primary-600 hover:text-primary-800">
                Admin Dashboard
              </Link>
            )}
            
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
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Your Conversations</h2>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Conversation
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : chats.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No conversations yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first multi-LLM conversation to get started.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition"
            >
              Create a Conversation
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chats.map(chat => (
              <Link
                key={chat.id}
                to={`/chat/${chat.id}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
              >
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-2 truncate">{chat.topic}</h3>
                  <div className="flex space-x-2 mb-4">
                    {chat.llms.map(llm => {
                      const option = llmOptions.find(opt => opt.id === llm);
                      return (
                        <span
                          key={llm}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                        >
                          {option?.logo && <span className="mr-1">{option.logo}</span>}
                          {llm}
                        </span>
                      );
                    })}
                  </div>
                  <p className="text-sm text-gray-500">
                    Created: {formatDate(chat.created_at)}
                  </p>
                </div>
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
                  <div className="text-sm text-primary-600 font-medium">View conversation →</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      
      {/* Create chat modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Create a New Conversation</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
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
              
              <div className="mb-4">
                <label htmlFor="topic" className="block text-gray-700 font-medium mb-2">
                  Conversation Topic
                </label>
                <input
                  type="text"
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., The future of AI, Climate change solutions, Philosophy of mind..."
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  Select LLMs (2-3)
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Choose 2-3 AI models to participate in the conversation.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {llmOptions.map(llm => (
                    <div
                      key={llm.id}
                      onClick={() => toggleLLM(llm.id)}
                      className={`border rounded-md p-3 cursor-pointer transition ${
                        selectedLLMs.includes(llm.id)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="text-2xl mr-2">{llm.logo}</div>
                        <div>
                          <div className="font-medium">{llm.name}</div>
                          <div className="text-xs text-gray-500 truncate">{llm.description}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Selected: {selectedLLMs.length}/3
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition mr-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateChat}
                  className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition"
                >
                  Create Conversation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
