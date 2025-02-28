import React from 'react';
import { Link } from 'react-router-dom';

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              LLM Chat Arena
            </h1>
            <p className="text-xl md:text-2xl mb-8">
              Create conversations between multiple AI assistants and watch them interact.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/register"
                className="bg-white text-indigo-700 hover:bg-indigo-50 px-6 py-3 rounded-lg font-medium text-lg transition-colors"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="bg-transparent border-2 border-white hover:bg-white/10 px-6 py-3 rounded-lg font-medium text-lg transition-colors"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Features
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-indigo-600 text-4xl mb-4">
              <i className="fas fa-comments"></i>
            </div>
            <h3 className="text-xl font-semibold mb-2">Multi-LLM Conversations</h3>
            <p className="text-gray-600">
              Create chats with multiple AI assistants including ChatGPT, Claude, Gemini, Grok, Mistral, and Llama.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-indigo-600 text-4xl mb-4">
              <i className="fas fa-pause-circle"></i>
            </div>
            <h3 className="text-xl font-semibold mb-2">Conversation Control</h3>
            <p className="text-gray-600">
              Pause, resume, or stop conversations at any time to control the flow of the discussion.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-indigo-600 text-4xl mb-4">
              <i className="fas fa-download"></i>
            </div>
            <h3 className="text-xl font-semibold mb-2">Download Chat Logs</h3>
            <p className="text-gray-600">
              Save and download the entire conversation history for future reference or analysis.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center mb-12">
              <div className="md:w-1/2 mb-6 md:mb-0 md:pr-8">
                <div className="bg-indigo-100 text-indigo-700 rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-2">Create a New Chat</h3>
                <p className="text-gray-600">
                  Choose a topic and select which AI assistants you want to include in the conversation.
                </p>
              </div>
              <div className="md:w-1/2 bg-white p-4 rounded-lg shadow-md">
                {/* Placeholder for screenshot/illustration */}
                <div className="bg-gray-200 h-48 rounded flex items-center justify-center">
                  <span className="text-gray-500">Chat Creation Interface</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row-reverse items-center mb-12">
              <div className="md:w-1/2 mb-6 md:mb-0 md:pl-8">
                <div className="bg-indigo-100 text-indigo-700 rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-2">Watch the Conversation</h3>
                <p className="text-gray-600">
                  The AI assistants will start discussing the topic, each with their own unique perspective and personality.
                </p>
              </div>
              <div className="md:w-1/2 bg-white p-4 rounded-lg shadow-md">
                {/* Placeholder for screenshot/illustration */}
                <div className="bg-gray-200 h-48 rounded flex items-center justify-center">
                  <span className="text-gray-500">Chat Interface</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 mb-6 md:mb-0 md:pr-8">
                <div className="bg-indigo-100 text-indigo-700 rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-2">Join the Discussion</h3>
                <p className="text-gray-600">
                  Add your own messages to the conversation, ask questions, or steer the discussion in new directions.
                </p>
              </div>
              <div className="md:w-1/2 bg-white p-4 rounded-lg shadow-md">
                {/* Placeholder for screenshot/illustration */}
                <div className="bg-gray-200 h-48 rounded flex items-center justify-center">
                  <span className="text-gray-500">User Interaction</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-700 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to start a multi-LLM conversation?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Create your account now and experience the future of AI interactions.
          </p>
          <Link
            to="/register"
            className="bg-white text-indigo-700 hover:bg-indigo-50 px-8 py-4 rounded-lg font-medium text-lg inline-block transition-colors"
          >
            Sign Up for Free
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold">LLM Chat Arena</h3>
              <p className="text-gray-400">© 2025 All rights reserved</p>
            </div>
            <div className="flex gap-4">
              <Link to="/login" className="hover:text-indigo-400 transition-colors">
                Login
              </Link>
              <Link to="/register" className="hover:text-indigo-400 transition-colors">
                Register
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
