#!/bin/bash

API_BASE_URL="https://netlog-dev-backend.yuan88yuan-tw.workers.dev"

function list_events_by_source_name() {
	local source_name="$1"
	if [ -z "$source_name" ]; then
		echo "Usage: $0 list-by-name <event_source_name>"
		return 1
	fi

	echo "Fetching event source ID for '$source_name'..."
	SOURCE_ID=$(curl -s "${API_BASE_URL}/event-sources" | jq -r ".[] | select(.name == \"${source_name}\") | .id")

	if [ -z "$SOURCE_ID" ]; then
		echo "Error: Event source '$source_name' not found."
		return 1
	fi

	echo "Retrieving event logs for source '$source_name' (ID: $SOURCE_ID)..."
	echo "----------------------------------------------------------------------------------------------------"
	echo "ID    Source Name           Timestamp                     Content"
	echo "----------------------------------------------------------------------------------------------------"
	curl -s "${API_BASE_URL}/event-logs/source/${SOURCE_ID}" | jq -r '.[] | "\(.id)\t\(.event_source_name)\t\(.timestamp)\t\(.content)"' | column -t -s $'	'
	echo "----------------------------------------------------------------------------------------------------"
}

function create_event() {
	local source_name="$1"
	local content="$2"
	if [ -z "$source_name" ] || [ -z "$content" ]; then
		echo "Usage: $0 create <event_source_name> <event_content>"
		return 1
	fi

	# echo "Creating event log for source '$source_name' with content: '$content' ..."
	curl -X POST "${API_BASE_URL}/event-logs" \
			 -H "Content-Type: application/json" \
			 -d "{\"event_source_name\": \"${source_name}\", \"content\": \"${content}\"}"
}

function list_all_events() {
	echo "Retrieving all event logs, ordered by timestamp..."
	echo "----------------------------------------------------------------------------------------------------"
	echo "ID    Source Name           Timestamp                     Content"
	echo "----------------------------------------------------------------------------------------------------"
	curl -s "${API_BASE_URL}/event-logs" | jq -r '.[] | "\(.id)\t\(.event_source_name)\t\(.timestamp)\t\(.content)"' | column -t -s $'	'
	echo "----------------------------------------------------------------------------------------------------"
}

function prune_events_by_source_name() {
	local source_name="$1"
	local count="$2"
	if [ -z "$source_name" ] || [ -z "$count" ]; then
		echo "Usage: $0 create <event_source_name> <count>"
		return 1
	fi

	curl -X DELETE "${API_BASE_URL}/event-logs/prune" \
		-H "Content-Type: application/json" \
		-d "{\"event_source_name\": \"${source_name}\", \"count\": \"${count}\"}"

	echo "" # Add a newline for better readability
}

case "$1" in
	list-by-name)
		list_events_by_source_name "$2"
		;;
	create)
		create_event "$2" "$3"
		;;
	list-all)
		list_all_events
		;;
	prune-by-name)
		prune_events_by_source_name "$2" "$3"
		;;
	*)
		echo "Usage: $0 {list-by-name <event_source_name> | create <event_source_name> <event_content> | list-all}"
		exit 1
		;;
esac
