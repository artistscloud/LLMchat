import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

const ChatRoom: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { user, profile } = useAuth();
  const { 
    currentChat, 
    messages, 
    isLoading, 
    thinkingLLMs,
    loadChat, 
    sendUserMessage,
    pauseConversation,
    resumeConversation,
    stopConversation,
    downloadChatLog
  } = useChat();
  
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Load chat on component mount
  useEffect(() => {
    if (chatId) {
      loadChat(chatId);
    }
  }, [chatId, loadChat]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !profile?.username) return;
    
    await sendUserMessage(message, profile.username);
    setMessage('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading chat...</p>
        </div>
      </div>
    );
  }
  
  if (!currentChat) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Chat not found</h2>
          <p className="text-gray-600 mb-6">The chat you're looking for doesn't exist or you don't have access to it.</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center">
              <Link to="/dashboard" className="text-indigo-600 hover:text-indigo-800 mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </Link>
              {currentChat.topic}
            </h1>
            <div className="text-sm text-gray-500 mt-1">
              Participants: {currentChat.llms.join(', ')}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {currentChat.status === 'active' && (
              <button
                onClick={pauseConversation}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Pause
              </button>
            )}
            {currentChat.status === 'paused' && (
              <button
                onClick={resumeConversation}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Resume
              </button>
            )}
            {currentChat.status !== 'stopped' && (
              <button
                onClick={stopConversation}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Stop
              </button>
            )}
            <button
              onClick={downloadChatLog}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Download Log
            </button>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.is_user ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-lg rounded-lg px-4 py-2 ${
                  msg.is_user
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-800 shadow'
                }`}
              >
                <div className="flex items-center mb-1">
                  <span className={`font-medium ${msg.is_user ? 'text-indigo-100' : 'text-indigo-600'}`}>
                    {msg.sender}
                  </span>
                  <span className={`text-xs ml-2 ${msg.is_user ? 'text-indigo-200' : 'text-gray-500'}`}>
                    {formatTimestamp(msg.created_at)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          
          {/* Thinking indicators */}
          {thinkingLLMs.map((llm) => (
            <div key={`thinking-${llm}`} className="flex justify-start">
              <div className="max-w-lg rounded-lg px-4 py-2 bg-white text-gray-800 shadow">
                <div className="flex items-center mb-1">
                  <span className="font-medium text-indigo-600">{llm}</span>
                  <span className="text-xs ml-2 text-gray-500">Thinking...</span>
                </div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          ))}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex space-x-4">
            <div className="flex-1">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                rows={2}
                disabled={currentChat.status === 'stopped'}
              ></textarea>
              {currentChat.status === 'stopped' && (
                <p className="mt-1 text-xs text-red-500">
                  This conversation has been stopped and cannot be continued.
                </p>
              )}
              {currentChat.status === 'paused' && (
                <p className="mt-1 text-xs text-yellow-500">
                  This conversation is paused. Resume to continue.
                </p>
              )}
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={!message.trim() || currentChat.status !== 'active'}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  !message.trim() || currentChat.status !== 'active'
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
