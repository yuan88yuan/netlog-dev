#!/bin/bash

# 使用 ip 指令列出所有網卡
for iface in $(ip -o link show | awk -F': ' '{print $2}'); do
	# 取得狀態 (UP/DOWN)
	state=$(cat /sys/class/net/$iface/operstate 2>/dev/null)

	# 取得 IPv4 位址（若有）
	ip_addr=$(ip -4 addr show "$iface" | awk '/inet /{print $2}' | cut -d/ -f1)

	# 若沒有 IP，顯示為 "-"
	if [ -z "$ip_addr" ]; then
		ip_addr="-"
	fi

	printf "[%s:%s]" "$iface" "$ip_addr"
done
