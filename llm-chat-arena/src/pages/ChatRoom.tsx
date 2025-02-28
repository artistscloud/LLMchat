import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { ChatMessage } from '../services/socketService';
import '../styles/chat.css';

// Define types
interface MessageProps {
  message: ChatMessage;
  isUser: boolean;
  username: string;
}

// Helper function to format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString();
};

const ChatRoom: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { profile } = useAuth();
  const { 
    currentChat, 
    messages, 
    thinkingLLMs, 
    loadChat, 
    sendUserMessage, 
    pauseConversation, 
    resumeConversation, 
    stopConversation, 
    downloadChatLog,
    isLoading 
  } = useChat();
  
  const [userMessage, setUserMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  // Load chat data
  useEffect(() => {
    if (chatId) {
      loadChat(chatId);
    }
  }, [chatId, loadChat]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinkingLLMs]);
  
  // Handle send message
  const handleSendMessage = async () => {
    if (!userMessage.trim() || !profile || !chatId) return;
    
    await sendUserMessage(userMessage, profile.username);
    setUserMessage('');
  };
  
  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Get LLM avatar
  const getLLMAvatar = (llmName: string) => {
    const avatarMap: Record<string, string> = {
      'ChatGPT': '🤖',
      'Claude': '🧠',
      'Gemini': '🌐',
      'Grok': '⚡',
      'Mistral': '🌀',
      'Llama': '🦙'
    };
    
    return avatarMap[llmName] || '👤';
  };
  
  // Message component
  const Message: React.FC<MessageProps> = ({ message, isUser, username }) => {
    return (
      <div className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-3xl rounded-lg px-4 py-3 ${
          isUser 
            ? 'bg-primary-600 text-white rounded-br-none' 
            : 'bg-gray-100 text-gray-800 rounded-bl-none'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <div className="font-medium flex items-center">
              {!isUser && (
                <span className="mr-2 text-lg" role="img" aria-label={message.sender}>
                  {getLLMAvatar(message.sender)}
                </span>
              )}
              {isUser ? username : message.sender}
            </div>
            <div className="text-xs opacity-75">
              {formatDate(message.created_at)}
            </div>
          </div>
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>
      </div>
    );
  };
  
  // Thinking indicator
  const ThinkingIndicator: React.FC<{ llm: string }> = ({ llm }) => {
    return (
      <div className="flex mb-4 justify-start">
        <div className="max-w-3xl rounded-lg px-4 py-3 bg-gray-50 text-gray-500 rounded-bl-none">
          <div className="flex items-center mb-1">
            <div className="font-medium flex items-center">
              <span className="mr-2 text-lg" role="img" aria-label={llm}>
                {getLLMAvatar(llm)}
              </span>
              {llm}
            </div>
          </div>
          <div className="flex items-center">
            <div className="dot-typing"></div>
            <div className="ml-2">Thinking...</div>
          </div>
        </div>
      </div>
    );
  };
  
  // Back to dashboard
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  if (!currentChat) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Chat not found</h2>
          <p className="text-gray-600 mb-6">The chat you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={handleBackToDashboard}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={handleBackToDashboard}
              className="text-gray-600 hover:text-gray-800 mr-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-800 truncate max-w-md">
              {currentChat.topic}
            </h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              {currentChat.llms.map(llm => (
                <div 
                  key={llm} 
                  className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-800"
                  title={llm}
                >
                  {getLLMAvatar(llm)}
                </div>
              ))}
            </div>
            
            <div className="flex items-center ml-4">
              <button
                onClick={downloadChatLog}
                className="text-gray-600 hover:text-gray-800 mr-2"
                title="Download chat log"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
              
              {currentChat.status === 'active' ? (
                <button
                  onClick={pauseConversation}
                  className="text-gray-600 hover:text-gray-800 mr-2"
                  title="Pause conversation"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              ) : currentChat.status === 'paused' ? (
                <button
                  onClick={resumeConversation}
                  className="text-gray-600 hover:text-gray-800 mr-2"
                  title="Resume conversation"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              ) : null}
              
              <button
                onClick={stopConversation}
                className="text-gray-600 hover:text-gray-800"
                title="Stop conversation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Chat area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          <div className="container mx-auto max-w-4xl">
            {/* System message */}
            <div className="bg-gray-100 rounded-lg p-4 mb-6 text-center">
              <p className="text-gray-600">
                <span className="font-medium">Topic:</span> {currentChat.topic}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                <span className="font-medium">Participants:</span> {currentChat.llms.join(', ')}
              </p>
            </div>
            
            {/* Messages */}
            {messages.map(message => (
              <Message 
                key={message.id} 
                message={message} 
                isUser={message.is_user} 
                username={profile?.username || 'User'} 
              />
            ))}
            
            {/* Thinking indicators */}
            {thinkingLLMs.map(llm => (
              <ThinkingIndicator key={llm} llm={llm} />
            ))}
            
            {/* Status indicators */}
            {currentChat.status === 'paused' && (
              <div className="text-center my-4">
                <div className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                  Conversation paused
                </div>
              </div>
            )}
            
            {currentChat.status === 'stopped' && (
              <div className="text-center my-4">
                <div className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                  Conversation stopped
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Input area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="container mx-auto max-w-4xl">
            <div className="flex">
              <textarea
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 border border-gray-300 rounded-l-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                rows={2}
                disabled={currentChat.status === 'stopped'}
              />
              <button
                onClick={handleSendMessage}
                disabled={!userMessage.trim() || currentChat.status === 'stopped'}
                className={`bg-primary-600 text-white px-4 rounded-r-md ${
                  !userMessage.trim() || currentChat.status === 'stopped'
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-primary-700'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            {currentChat.status === 'stopped' && (
              <p className="text-sm text-red-600 mt-2">
                This conversation has been stopped and cannot be continued.
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* CSS for typing animation is in a separate CSS file */}
    </div>
  );
};

export default ChatRoom;
