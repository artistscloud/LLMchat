# LLM Chat Arena

A React TypeScript application that allows users to create multi-LLM conversations where different AI models can discuss topics and interact with the user.

## Features

- **Multi-LLM Conversations**: Create chats with multiple AI models (ChatGPT, Claude, Gemini, Grok, Mistral, Llama)
- **Real-time Interaction**: Jump into the conversation at any time
- **Conversation Control**: Pause, resume, or stop conversations as needed
- **Download Transcripts**: Save chat logs for future reference
- **User Authentication**: Secure login and registration system
- **Admin Dashboard**: Manage users, API keys, and view analytics
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **State Management**: React Context API with singleton service pattern
- **Authentication & Database**: Supabase
- **Real-time Communication**: Socket.io with class-based architecture
- **API Integration**: OpenAI, Anthropic, Google, OpenRouter
- **Logging**: Winston (server-side)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account
- API keys for the LLM providers you want to use

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/llm-chat-arena.git
cd llm-chat-arena
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_SOCKET_URL=your_socket_server_url
```

4. Start the development server
```bash
npm start
```

## Project Structure

```
llm-chat-arena/
├── public/                  # Static files
├── src/
│   ├── components/          # Reusable UI components
│   ├── context/             # React context providers
│   │   ├── AuthContext.tsx  # Authentication context
│   │   └── ChatContext.tsx  # Chat management context
│   ├── pages/               # Page components
│   │   ├── admin/           # Admin pages
│   │   ├── Landing.tsx      # Landing page
│   │   ├── Login.tsx        # Login page
│   │   ├── Register.tsx     # Registration page
│   │   ├── Dashboard.tsx    # User dashboard
│   │   ├── ChatRoom.tsx     # Chat interface
│   │   └── NotFound.tsx     # 404 page
│   ├── services/            # API and service integrations
│   │   ├── supabase.ts      # Supabase client and helpers
│   │   ├── llmService.ts    # LLM API integrations
│   │   └── socketService.ts # Socket.io integration
│   ├── styles/              # CSS files
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── App.tsx              # Main app component with routing
│   └── index.tsx            # Entry point
├── .env                     # Environment variables
├── package.json             # Dependencies and scripts
├── tailwind.config.js       # Tailwind CSS configuration
└── tsconfig.json            # TypeScript configuration
```

## Database Schema

### Tables

1. **profiles**
   - id (primary key, references auth.users.id)
   - username
   - email
   - role ('user' or 'admin')
   - created_at

2. **chats**
   - id (primary key)
   - user_id (references profiles.id)
   - topic
   - llms (array of LLM names)
   - created_at
   - status ('active', 'paused', or 'stopped')

3. **messages**
   - id (primary key)
   - chat_id (references chats.id)
   - sender
   - content
   - is_user (boolean)
   - created_at

4. **api_keys**
   - id (primary key)
   - provider
   - key (encrypted)
   - endpoint (optional)
   - active (boolean)
   - created_at
   - last_used (optional)

## API Integrations

The application integrates with the following LLM providers:

- **OpenAI (ChatGPT)**: Direct API integration
- **Anthropic (Claude)**: Direct API integration
- **Google (Gemini)**: Direct API integration
- **OpenRouter**: Used for accessing Grok, Mistral, and Llama models

## Socket.io Server

The application uses a Socket.io server for real-time communication between LLMs and users. The server handles:

- Real-time message delivery
- LLM thinking indicators
- Conversation control (pause, resume, stop)
- User presence

## Deployment

### Frontend

The React application can be deployed to services like Vercel, Netlify, or AWS Amplify.

```bash
npm run build
```

### Socket.io Server

The Socket.io server should be deployed to a service that supports WebSockets, such as Heroku, AWS, or DigitalOcean.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI, Anthropic, Google, and other LLM providers for their amazing models
- The React and TypeScript communities for their excellent documentation and tools
- Supabase for their powerful backend-as-a-service platform
