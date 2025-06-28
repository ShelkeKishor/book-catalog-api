#!/bin/bash

echo "Starting server for API tests..."
cd backend
node index.js > server.log 2>&1 &
SERVER_PID=$!

echo "Waiting for server to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0
until curl -s http://localhost:3000/api/books > /dev/null; do
  if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "Server failed to start. Server logs:"
    cat server.log
    exit 1
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "Attempt $RETRY_COUNT/$MAX_RETRIES - Waiting for server..."
  sleep 2
done
echo "Server is ready!"

echo "Running API tests..."

# Create a test user
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}')

echo "Registration response: $REGISTER_RESPONSE"

# Login and get token
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}')

echo "Login response: $LOGIN_RESPONSE"

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "Failed to get auth token"
  exit 1
fi

# Test book creation
BOOK_RESPONSE=$(curl -s -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Test Book","author":"Test Author","published_year":2024}')

echo "Book creation response: $BOOK_RESPONSE"

BOOK_ID=$(echo $BOOK_RESPONSE | jq -r '.id')
if [ "$BOOK_ID" == "null" ] || [ -z "$BOOK_ID" ]; then
  echo "Failed to create book"
  exit 1
fi

# Test book retrieval
BOOKS_RESPONSE=$(curl -s -X GET http://localhost:3000/api/books \
  -H "Authorization: Bearer $TOKEN")

echo "Books retrieval response: $BOOKS_RESPONSE"

BOOKS_COUNT=$(echo $BOOKS_RESPONSE | jq '. | length')
if [ "$BOOKS_COUNT" -ne 1 ]; then
  echo "Expected 1 book, got $BOOKS_COUNT"
  exit 1
fi

echo "All tests passed successfully!"

echo "Cleaning up..."
kill $SERVER_PID || true 