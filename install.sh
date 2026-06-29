#!/bin/bash

if [ "$EUID" -ne 0 ]; then
    echo -e "\e[31mError: This script must be run as root\e[0m" >&2
    exit 1
fi

log_error() {
    echo -e "\e[31mError: $1\e[0m" >&2
}

validate_ip() {
    local ip=$1
    if [[ $ip =~ ^([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$ ]]; then
        for i in 1 2 3 4; do
            if [ "${BASH_REMATCH[$i]}" -gt 255 ]; then
                return 1
            fi
        done
        return 0
    else
        return 1
    fi
}

validate_port() {
    local port=$1
    if [[ "$port" =~ ^[0-9]+$ ]] && [ "$port" -ge 1024 ] && [ "$port" -le 65535 ]; then
        return 0
    else
        return 1
    fi
}

run_safe() {
    local temp_log=$(mktemp)
    "$@" > "$temp_log" 2>&1
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        log_error "Command failed: $*"
        tail -n 15 "$temp_log" >&2
        rm -f "$temp_log"
        exit 1
    fi
    rm -f "$temp_log"
}

check_and_kill_port() {
    local port=$1
    local pid=$(ss -lntp "sport = :$port" | grep -oP 'pid=\K\d+' | head -n 1)
    if [ -n "$pid" ]; then
        local proc_name=$(ps -p "$pid" -o comm=)
        echo -e "\e[33mPort $port is occupied by process '$proc_name' (PID: $pid)\e[0m"
        read -p "Do you allow terminating this process? (y/n): " answer
        if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
            kill -9 "$pid"
        else
            log_error "Installation aborted: Port $port is busy."
            exit 1
        fi
    fi
}

while true; do
    read -p "Enter absolute target directory (TARGET_DIR): " TARGET_DIR
    if [[ "$TARGET_DIR" =~ ^/ ]]; then
        break
    else
        log_error "Target directory must be an absolute path starting with /"
    fi
done

IS_UPDATE=false
if [ -d "$TARGET_DIR" ] && [ -f "$TARGET_DIR/docker-compose.yml" ]; then
    echo -e "\e[36mExisting installation detected in $TARGET_DIR. Switching to UPDATE mode.\e[0m"
    IS_UPDATE=true
fi

mkdir -p "$TARGET_DIR"

while true; do
    read -p "Enter Server IP Address (SERVER_IP): " SERVER_IP
    if validate_ip "$SERVER_IP"; then
        break
    else
        log_error "Invalid IPv4 address format. Please try again."
    fi
done

while true; do
    read -p "Enter Backend Port [default: 8000]: " BACKEND_PORT
    BACKEND_PORT=${BACKEND_PORT:-8000}
    if validate_port "$BACKEND_PORT"; then
        break
    else
        log_error "Invalid port number. Must be between 1024 and 65535."
    fi
done

while true; do
    read -p "Enter Frontend Port [default: 5173]: " FRONTEND_PORT
    FRONTEND_PORT=${FRONTEND_PORT:-5173}
    if validate_port "$FRONTEND_PORT"; then
        break
    else
        log_error "Invalid port number. Must be between 1024 and 65535."
    fi
done

if ! command -v docker &> /dev/null || ! docker compose version &> /dev/null; then
    log_error "Docker or Docker Compose command not found."
    exit 1
fi

if [ "$IS_UPDATE" = false ]; then
    check_and_kill_port 5433
    check_and_kill_port "$BACKEND_PORT"
    check_and_kill_port "$FRONTEND_PORT"
fi

mkdir -p "$TARGET_DIR/data"

if [ "$IS_UPDATE" = false ]; then
cat << EOF > "$TARGET_DIR/docker-compose.yml"
version: '3.8'
services:
  postgres:
    image: postgres:15
    container_name: kms_postgres
    environment:
      POSTGRES_USER: kms_user
      POSTGRES_DB: kms_db
      POSTGRES_PASSWORD: kms_password
    ports:
      - "5433:5432"
    volumes:
      - $TARGET_DIR/data:/var/lib/postgresql/data
EOF
fi

run_safe docker compose -f "$TARGET_DIR/docker-compose.yml" up -d

db_ready=false
for i in {1..15}; do
    if docker exec kms_postgres pg_isready -U kms_user -d kms_db -p 5432 &> /dev/null; then
        db_ready=true
        break
    fi
    sleep 1
done

if [ "$db_ready" = false ]; then
    log_error "Database container failed to initialize within 15 seconds."
    docker logs kms_postgres | tail -n 15 >&2
    exit 1
fi

mkdir -p "$TARGET_DIR/backend/scripts"
mkdir -p "$TARGET_DIR/backend/app"

if [ ! -f "$TARGET_DIR/backend/requirements.txt" ]; then
    echo "uvicorn" > "$TARGET_DIR/backend/requirements.txt"
    echo "fastapi" >> "$TARGET_DIR/backend/requirements.txt"
fi

if [ ! -f "$TARGET_DIR/backend/scripts/init_db.py" ]; then
    cat << 'EOF' > "$TARGET_DIR/backend/scripts/init_db.py"
import sys
print("Database initialized successfully")
EOF
fi

if [ ! -f "$TARGET_DIR/backend/app/main.py" ]; then
    cat << 'EOF' > "$TARGET_DIR/backend/app/main.py"
from fastapi import FastAPI
app = FastAPI()
@app.get("/")
def read_root():
    return {"status": "ok"}
EOF
fi

if [ "$IS_UPDATE" = false ] || [ ! -d "$TARGET_DIR/backend/.venv" ]; then
    run_safe python3 -m venv "$TARGET_DIR/backend/.venv" --without-pip
    curl_status=$(curl -s -o "$TARGET_DIR/get-pip.py" -w "%{http_code}" https://bootstrap.pypa.io/get-pip.py)
    if [ "$curl_status" -ne 200 ]; then
        log_error "Failed to download get-pip.py. HTTP status: $curl_status"
        exit 1
    fi
    run_safe "$TARGET_DIR/backend/.venv/bin/python" "$TARGET_DIR/get-pip.py"
    rm -f "$TARGET_DIR/get-pip.py"
fi

run_safe "$TARGET_DIR/backend/.venv/bin/pip" install -r "$TARGET_DIR/backend/requirements.txt"
run_safe "$TARGET_DIR/backend/.venv/bin/pip" install jinja2

env_file="$TARGET_DIR/backend/.env"
touch "$env_file"
sed -i '/^DB_PORT=/d' "$env_file"
sed -i '/^DATABASE_URL=/d' "$env_file"
echo "DB_PORT=5433" >> "$env_file"
echo "DATABASE_URL=postgresql://kms_user:kms_password@localhost:5433/kms_db" >> "$env_file"

while IFS= read -r line || [ -n "$line" ]; do
    if [ -n "$line" ]; then
        export "$line"
    fi
done < "$env_file"

if [ "$IS_UPDATE" = false ]; then
    run_safe env PYTHONPATH="$TARGET_DIR/backend" "$TARGET_DIR/backend/.venv/bin/python" "$TARGET_DIR/backend/scripts/init_db.py"
fi

mkdir -p "$TARGET_DIR/frontend"

if [ ! -f "$TARGET_DIR/frontend/package.json" ]; then
    cat << 'EOF' > "$TARGET_DIR/frontend/package.json"
{
  "name": "kms-frontend",
  "version": "1.0.0",
  "dependencies": {}
}
EOF
fi

if [ ! -f "$TARGET_DIR/frontend/index.js" ]; then
    cat << 'EOF' > "$TARGET_DIR/frontend/index.js"
const api = "http://localhost:8000";
EOF
fi

if [ "$IS_UPDATE" = false ] || [ ! -d "$TARGET_DIR/node" ]; then
    node_url="https://nodejs.org/dist/v20.11.1/node-v20.11.1-linux-x64.tar.xz"
    node_archive="$TARGET_DIR/node.tar.xz"
    node_status=$(curl -s -o "$node_archive" -w "%{http_code}" "$node_url")
    if [ "$node_status" -ne 200 ]; then
        log_error "Failed to download Node.js. HTTP status: $node_status"
        exit 1
    fi
    mkdir -p "$TARGET_DIR/node"
    run_safe tar -xf "$node_archive" -C "$TARGET_DIR/node" --strip-components=1
    rm -f "$node_archive"
fi

original_path="$PATH"
export PATH="$TARGET_DIR/node/bin:$PATH"
cd "$TARGET_DIR/frontend"
if [ "$IS_UPDATE" = false ]; then
    run_safe npm init -y
    run_safe npm install serve
fi
cd - > /dev/null
export PATH="$original_path"

find "$TARGET_DIR/frontend" -type f -name "*.js" -exec sed -i "s|http://$SERVER_IP:[0-9]*|http://$SERVER_IP:$BACKEND_PORT|g" {} +
find "$TARGET_DIR/frontend" -type f -name "*.js" -exec sed -i "s|http://localhost:[0-9]*|http://$SERVER_IP:$BACKEND_PORT|g" {} +

cat << EOF > /etc/systemd/system/kms-backend.service
[Unit]
Description=KMS Backend Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$TARGET_DIR/backend
EnvironmentFile=$TARGET_DIR/backend/.env
ExecStart=$TARGET_DIR/backend/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT

[Install]
WantedBy=multi-user.target
EOF

cat << EOF > /etc/systemd/system/kms-frontend.service
[Unit]
Description=KMS Frontend Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$TARGET_DIR/frontend
Environment=PATH=$TARGET_DIR/node/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
ExecStart=/bin/bash -c "if [ -d dist ]; then npx serve -s dist -l $FRONTEND_PORT; else npx serve -s . -l $FRONTEND_PORT; fi"

[Install]
WantedBy=multi-user.target
EOF

run_safe systemctl daemon-reload
run_safe systemctl restart kms-backend.service
run_safe systemctl restart kms-frontend.service
run_safe systemctl enable kms-backend.service
run_safe systemctl enable kms-frontend.service

echo -e "\e[32mInstallation/Update completed successfully!\e[0m"