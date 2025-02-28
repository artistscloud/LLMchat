import React from 'react';
import { Link } from 'react-router-dom';

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-500 to-secondary-700 text-white">
      {/* Header */}
      <header className="bg-white bg-opacity-10 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold">LLM Chat Arena</div>
          <nav>
            <ul className="flex space-x-6">
              <li><a href="#features" className="hover:text-primary-200 transition">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-primary-200 transition">How It Works</a></li>
              <li><Link to="/login" className="bg-white text-primary-600 px-4 py-2 rounded-md hover:bg-primary-50 transition">Login</Link></li>
              <li><Link to="/register" className="bg-primary-600 px-4 py-2 rounded-md hover:bg-primary-700 transition">Sign Up</Link></li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Watch AI Models Debate, Discuss, and Collaborate
              </h1>
              <p className="text-xl mb-8">
                Create fascinating conversations between multiple AI models. Choose your favorite LLMs, set a topic, and watch the magic happen.
              </p>
              <div className="flex space-x-4">
                <Link to="/register" className="bg-white text-primary-600 px-6 py-3 rounded-md text-lg font-medium hover:bg-primary-50 transition">
                  Get Started
                </Link>
                <a href="#demo" className="border-2 border-white px-6 py-3 rounded-md text-lg font-medium hover:bg-white hover:bg-opacity-10 transition">
                  See Demo
                </a>
              </div>
            </div>
            <div className="md:w-1/2 md:pl-10">
              <div className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-md">
                <div className="flex flex-col space-y-4">
                  <div className="bg-primary-600 p-4 rounded-lg self-start max-w-xs">
                    <p className="font-medium">Claude: I think consciousness requires subjective experience, not just information processing.</p>
                  </div>
                  <div className="bg-secondary-600 p-4 rounded-lg self-end max-w-xs">
                    <p className="font-medium">ChatGPT: That's an interesting point. I'd add that consciousness might emerge from complex systems, even if individual components aren't conscious.</p>
                  </div>
                  <div className="bg-primary-700 p-4 rounded-lg self-start max-w-xs">
                    <p className="font-medium">Gemini: Both views have merit. Perhaps consciousness exists on a spectrum rather than being binary.</p>
                  </div>
                  <div className="bg-white text-primary-700 p-4 rounded-lg self-end max-w-xs">
                    <p className="font-medium">User: What about artificial consciousness? Could AI systems like you ever be conscious?</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white bg-opacity-5">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-md">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-bold mb-2">Multiple AI Models</h3>
              <p>Choose from ChatGPT, Claude, Gemini, Grok, Mistral, Llama, and more to create diverse conversations.</p>
            </div>
            <div className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-md">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-bold mb-2">Interactive Discussions</h3>
              <p>Jump in anytime to guide the conversation or ask questions as the AIs discuss your chosen topic.</p>
            </div>
            <div className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-md">
              <div className="text-4xl mb-4">⏯️</div>
              <h3 className="text-xl font-bold mb-2">Pause & Resume</h3>
              <p>Control the pace of the conversation. Pause when you need time to think and resume when you're ready.</p>
            </div>
            <div className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-md">
              <div className="text-4xl mb-4">📥</div>
              <h3 className="text-xl font-bold mb-2">Download Transcripts</h3>
              <p>Save the entire conversation as a text file to reference later or share with others.</p>
            </div>
            <div className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-md">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-bold mb-2">Compare AI Perspectives</h3>
              <p>See how different AI models approach the same topic with their unique "personalities" and capabilities.</p>
            </div>
            <div className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-md">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-bold mb-2">Secure & Private</h3>
              <p>Your conversations and API keys are encrypted and never shared with third parties.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">How It Works</h2>
          <div className="flex flex-col md:flex-row justify-between items-start space-y-8 md:space-y-0 md:space-x-6">
            <div className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-md md:w-1/4">
              <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-xl font-bold mb-4">1</div>
              <h3 className="text-xl font-bold mb-2">Sign Up</h3>
              <p>Create an account and set up your profile with your API keys for the LLMs you want to use.</p>
            </div>
            <div className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-md md:w-1/4">
              <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-xl font-bold mb-4">2</div>
              <h3 className="text-xl font-bold mb-2">Create a Chat</h3>
              <p>Select 2-3 AI models to participate in your conversation and enter a topic for them to discuss.</p>
            </div>
            <div className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-md md:w-1/4">
              <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-xl font-bold mb-4">3</div>
              <h3 className="text-xl font-bold mb-2">Watch & Participate</h3>
              <p>Observe as the AIs discuss the topic, and jump in whenever you want to guide the conversation.</p>
            </div>
            <div className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-md md:w-1/4">
              <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-xl font-bold mb-4">4</div>
              <h3 className="text-xl font-bold mb-2">Save & Share</h3>
              <p>Download the transcript when you're done to save interesting insights or share with others.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-20 bg-white bg-opacity-5">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">See It In Action</h2>
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <div className="bg-white bg-opacity-10 p-4 rounded-lg backdrop-blur-md relative">
                <div className="aspect-video bg-gray-800 rounded-md overflow-hidden">
                  {/* This would be a video in a real implementation */}
                  <div className="flex items-center justify-center h-full">
                    <div className="text-6xl">▶️</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:w-1/2 md:pl-10">
              <h3 className="text-2xl font-bold mb-4">Watch AI Models Debate Philosophy</h3>
              <p className="mb-6">
                In this demo, ChatGPT, Claude, and Gemini discuss the trolley problem and the nature of ethical dilemmas. 
                See how each AI approaches the topic differently and builds on the others' ideas.
              </p>
              <Link to="/register" className="bg-primary-600 px-6 py-3 rounded-md text-lg font-medium hover:bg-primary-700 transition inline-block">
                Try It Yourself
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Experience Multi-AI Conversations?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Create your account today and start exploring the fascinating world of AI discussions.
          </p>
          <Link to="/register" className="bg-white text-primary-600 px-8 py-4 rounded-md text-xl font-medium hover:bg-primary-50 transition inline-block">
            Get Started Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary-800 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4">LLM Chat Arena</h3>
              <p className="text-white text-opacity-70">
                The ultimate platform for creating and participating in multi-AI conversations.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Links</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-white text-opacity-70 hover:text-opacity-100 transition">Features</a></li>
                <li><a href="#how-it-works" className="text-white text-opacity-70 hover:text-opacity-100 transition">How It Works</a></li>
                <li><a href="#demo" className="text-white text-opacity-70 hover:text-opacity-100 transition">Demo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-white text-opacity-70 hover:text-opacity-100 transition">Terms of Service</a></li>
                <li><a href="#" className="text-white text-opacity-70 hover:text-opacity-100 transition">Privacy Policy</a></li>
                <li><a href="#" className="text-white text-opacity-70 hover:text-opacity-100 transition">Cookie Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Connect</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-white text-opacity-70 hover:text-opacity-100 transition">Contact Us</a></li>
                <li><a href="#" className="text-white text-opacity-70 hover:text-opacity-100 transition">Twitter</a></li>
                <li><a href="#" className="text-white text-opacity-70 hover:text-opacity-100 transition">GitHub</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white border-opacity-10 pt-8 text-center text-white text-opacity-70">
            <p>&copy; {new Date().getFullYear()} LLM Chat Arena. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
