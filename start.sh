#!/bin/bash

# Start the backend server
echo "Starting backend server..."
cd server
npm run dev &
BACKEND_PID=$!

# Wait a moment for the backend to start
sleep 2

# Start the frontend server on port 3001
echo "Starting frontend server..."
cd ..
PORT=3001 npm start &
FRONTEND_PID=$!

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
