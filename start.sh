#!/bin/bash

# Make sure we're using consistent ports
export PORT=3001
export REACT_APP_SOCKET_URL=http://localhost:3001

# Start the backend server
echo "Starting backend server..."
cd server
# Override the port in server/.env to match the frontend
PORT=3001 npm run dev &
BACKEND_PID=$!

# Wait a moment for the backend to start
sleep 3

# Build CSS with Tailwind
echo "Building CSS with Tailwind..."
cd ..
npm run build:css

# Start the frontend server on port 3001
echo "Starting frontend server..."
PORT=3001 npm start &
FRONTEND_PID=$!

# Print debug information
echo "Backend running on port 3001"
echo "Frontend running on port 3001"
echo "Socket.IO configured to connect to http://localhost:3001"

# Function to handle script termination
function cleanup {
  echo "Stopping servers..."
  kill $BACKEND_PID
  kill $FRONTEND_PID
  exit
}

# Trap SIGINT (Ctrl+C) and call cleanup
trap cleanup SIGINT

# Keep the script running
echo "Both servers are running. Press Ctrl+C to stop."
wait
