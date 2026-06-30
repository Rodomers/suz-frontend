#!/bin/bash

if [ "$EUID" -ne 0 ]; then
    echo -e "\e[31mError: This script must be run as root\e[0m" >&2
    exit 1
fi

log_error() {
    echo -e "\e[31mError: $1\e[0m" >&2
}

run_safe() {
    local temp_log=$(mktemp)
    "$@" > "$temp_log" 2>&1
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        log_error "Command failed: $*"
        tail -n 5 "$temp_log" >&2
        rm -f "$temp_log"
        return 1
    fi
    rm -f "$temp_log"
    return 0
}

TARGET_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

KEEP_DATA=true
while true; do
    read -p "Do you want to completely DELETE all database entries and files? (y/n) [default: n]: " answer
    answer=${answer:-n}
    if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
        KEEP_DATA=false
        break
    elif [ "$answer" = "n" ] || [ "$answer" = "N" ]; then
        KEEP_DATA=true
        break
    else
        echo "Please enter 'y' for delete or 'n' to keep data."
    fi
done

echo "Stopping services..."
systemctl stop kms-frontend.service 2>/dev/null
systemctl stop kms-backend.service 2>/dev/null
systemctl disable kms-frontend.service 2>/dev/null
systemctl disable kms-backend.service 2>/dev/null

rm -f /etc/systemd/system/kms-frontend.service
rm -f /etc/systemd/system/kms-backend.service
systemctl daemon-reload

if [ -f "$TARGET_DIR/docker-compose.yml" ]; then
    echo "Stopping and removing Docker containers..."
    if [ "$KEEP_DATA" = false ]; then
        run_safe docker compose -f "$TARGET_DIR/docker-compose.yml" down -v
    else
        run_safe docker compose -f "$TARGET_DIR/docker-compose.yml" down
    fi
fi

if [ "$KEEP_DATA" = false ]; then
    echo "Removing all data including the installation directory..."
    rm -rf "$TARGET_DIR"
else
    echo "Removing application binaries and keeping data storage..."
    rm -rf "$TARGET_DIR/backend"
    rm -rf "$TARGET_DIR/frontend"
    rm -rf "$TARGET_DIR/node"
fi

echo -e "\e[32mUninstallation completed successfully!\e[0m"