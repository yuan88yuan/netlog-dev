#!/bin/bash

# Script to prune the oldest 'n' event logs for a given event source.

BACKEND_URL="https://netlog-dev-backend.yuan88yuan-tw.workers.dev"
ENDPOINT="$BACKEND_URL/event-logs/prune"

# --- Argument Parsing ---
SOURCE_KEY=""
SOURCE_VALUE=""
COUNT=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --id)
      SOURCE_KEY="event_source_id"
      SOURCE_VALUE="$2"
      shift 2
      ;;
    --name)
      SOURCE_KEY="event_source_name"
      SOURCE_VALUE="$2"
      shift 2
      ;;
    --count)
      COUNT="$2"
      shift 2
      ;;
    *)
      echo "Usage: $0 [--id <source_id> | --name <source_name>] --count <number_of_logs>"
      exit 1
      ;;
  esac
done

# --- Validation ---
if [ -z "$SOURCE_KEY" ] || [ -z "$SOURCE_VALUE" ]; then
  echo "Error: You must specify an event source using --id or --name."
  echo "Usage: $0 [--id <source_id> | --name <source_name>] --count <number_of_logs>"
  exit 1
fi

if [ "$COUNT" -le 0 ]; then
  echo "Error: --count must be a positive number."
  echo "Usage: $0 [--id <source_id> | --name <source_name>] --count <number_of_logs>"
  exit 1
fi

# --- JSON Payload Construction ---
# Check if SOURCE_VALUE is a number for --id
if [ "$SOURCE_KEY" == "event_source_id" ]; then
  if ! [[ "$SOURCE_VALUE" =~ ^[0-9]+$ ]]; then
    echo "Error: --id must be a number."
    exit 1
  fi
  JSON_PAYLOAD=$(printf '{"%s": %s, "count": %s}' "$SOURCE_KEY" "$SOURCE_VALUE" "$COUNT")
else
  # For --name, value is a string
  JSON_PAYLOAD=$(printf '{"%s": "%s", "count": %s}' "$SOURCE_KEY" "$SOURCE_VALUE" "$COUNT")
fi


# --- cURL Request ---
echo "Sending DELETE request to: $ENDPOINT"
echo "Payload: $JSON_PAYLOAD"

curl -X DELETE "$ENDPOINT" \
     -H "Content-Type: application/json" \
     -d "$JSON_PAYLOAD"

echo "" # Add a newline for better readability
