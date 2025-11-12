#!/bin/bash

# networkd-dispatcher 在執行腳本時會提供以下環境變數：
# $IFACE: 發生狀態變化的網路介面名稱 (e.g., eth0)
# $ADDRFAMS: 地址族 (e.g., ipv4, ipv6)
# $STATE: 當前的網路狀態 (e.g., routable)

LOG_FILE="/var/log/dhcp_action_log.txt"
CURL_LOG="/var/log/curl_log.txt"
API_BASE_URL="https://netlog-dev-backend.yuan88yuan-tw.workers.dev"
source_name=`hostname`

# 檢查變數是否為空，確保在正確的事件中執行
if [ -z "$IFACE" ] || [ "$STATE" != "routable" ]; then
	exit 0
fi

# 取得介面的 IP 位址
# 使用 'ip a show $IFACE' 取得 IPv4 位址，並過濾出第一行 inet 地址
IP_ADDRESS=$(ip a show dev "$IFACE" | awk '/inet / {print $2}' | cut -d/ -f1 | head -n 1)

TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

if [ ! -z "$IP_ADDRESS" ]; then
	content="介面 $IFACE 成功獲取 IP: $IP_ADDRESS (狀態: $STATE)"

	curl --max-time 3 --retry 2 --silent \
		-X POST "${API_BASE_URL}/event-logs" \
		-H "Content-Type: application/json" \
		-d "{\"event_source_name\": \"${source_name}\", \"content\": \"${content}\"}" 2>&1 >> "$CURL_LOG" & disown

	echo "[$TIMESTAMP] $content" >> "$LOG_FILE"
	resolvectl query netlog-dev-backend.zzlee-tw.workers.dev 2>&1 >> "$LOG_FILE"	
else
	echo "[$TIMESTAMP] 介面 $IFACE 達到 $STATE 狀態，但未找到 IPv4 地址。" >> "$LOG_FILE"
fi

exit 0