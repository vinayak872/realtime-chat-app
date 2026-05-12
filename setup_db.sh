#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔧 Chat Application - Database Setup${NC}\n"

# MySQL path
MYSQL="/usr/local/mysql/bin/mysql"

# Check if MySQL is running
echo -e "${YELLOW}Checking MySQL connection...${NC}"
if ! $MYSQL -u root -e "SELECT 1" &> /dev/null; then
    echo -e "${RED}❌ MySQL is not running${NC}"
    echo -e "${YELLOW}Starting MySQL...${NC}"
    sudo /usr/local/mysql/support-files/mysql.server start
    sleep 2
fi

echo -e "${GREEN}✅ MySQL is running${NC}\n"

# Create database and user
echo -e "${YELLOW}Creating database and user...${NC}"

$MYSQL -u root << EOF
CREATE DATABASE IF NOT EXISTS chat_app;
CREATE USER IF NOT EXISTS 'root'@'localhost' IDENTIFIED BY 'root';
GRANT ALL PRIVILEGES ON chat_app.* TO 'root'@'localhost';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES;
USE chat_app;
EOF

echo -e "${GREEN}✅ Database setup complete${NC}\n"

# Test connection
echo -e "${YELLOW}Testing database connection...${NC}"
if $MYSQL -u root -p'root' -e "SELECT 1" &> /dev/null; then
    echo -e "${GREEN}✅ Connection successful${NC}\n"
else
    echo -e "${RED}❌ Connection failed${NC}\n"
    exit 1
fi

echo -e "${GREEN}✅ Database ready for application!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Terminal 1: cd backend && node src/index.js"
echo "2. Terminal 2: cd frontend && npm run dev"
echo "3. Browser: http://localhost:5173"
