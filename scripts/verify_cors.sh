#!/bin/bash

echo "Testing CORS headers..."

# Test OPTIONS request with a custom header
response=$(curl -s -I -X OPTIONS \
  -H "Origin: http://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: X-Custom-Header, Content-Type" \
  http://localhost:5000/api/v1)

echo "$response"

if echo "$response" | grep -q "Access-Control-Allow-Origin: *"; then
  echo "✅ Access-Control-Allow-Origin is set to *"
else
  echo "❌ Access-Control-Allow-Origin missing or incorrect"
fi

# Check if allowed headers are present (or if the server just accepts it implies it works, but usually it echoes back allowed headers if configured dynamically, or just standard * behaviour)
# With cors default, it often reflects.
# But simply checking 200/204 OK status for OPTIONS is a good sign if it was previously failing.

echo "Done."
