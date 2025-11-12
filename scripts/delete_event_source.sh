#!/bin/bash

# Script to delete an event source and its associated logs

# Check if event_source_id is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <event_source_id>"
  exit 1
fi

EVENT_SOURCE_ID=$1
BACKEND_URL="https://netlog-dev-backend.yuan88yuan-tw.workers.dev"

echo "Attempting to delete event source with ID: $EVENT_SOURCE_ID"
echo "Sending DELETE request to: $BACKEND_URL/event-sources/$EVENT_SOURCE_ID"

curl -X DELETE "$BACKEND_URL/event-sources/$EVENT_SOURCE_ID" \
     -H "Content-Type: application/json"

echo "" # Add a newline for better readability
