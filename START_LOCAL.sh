#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting Atlas WhatsApp Chatbot Locally...${NC}\n"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Please install Docker first.${NC}"
    echo "Download: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose not found.${NC}"
    exit 1
fi

# Start services
echo -e "${YELLOW}📦 Starting PostgreSQL database...${NC}"
docker-compose up -d

# Wait for PostgreSQL
echo -e "${YELLOW}⏳ Waiting for PostgreSQL...${NC}"
sleep 10

# Start backend
echo -e "${YELLOW}🔧 Starting backend (NestJS)...${NC}"
cd backend
npm install --silent
npm run build > /dev/null 2>&1
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo -e "${YELLOW}⏳ Waiting for backend to start...${NC}"
sleep 5

# Start frontend
echo -e "${YELLOW}🎨 Starting frontend (Vue 3)...${NC}"
cd frontend
npm install --silent
npm run build > /dev/null 2>&1
npm run preview &
FRONTEND_PID=$!
cd ..

# Display info
echo -e "\n${GREEN}✅ Services started!${NC}\n"
echo -e "${GREEN}📍 Access your chatbot:${NC}"
echo -e "   Backend:  ${GREEN}http://localhost:3001${NC}"
echo -e "   Frontend: ${GREEN}http://localhost:5173${NC}"
echo -e "   Database: ${GREEN}localhost:5433${NC}\n"

echo -e "${GREEN}📱 Panel Admin:${NC}"
echo -e "   URL: ${GREEN}http://localhost:5173${NC}"
echo -e "   Email: ${GREEN}admin@atlas.com${NC}"
echo -e "   Password: ${GREEN}admin123${NC}\n"

echo -e "${YELLOW}💡 Tips:${NC}"
echo "   - Test API: curl http://localhost:3001/api/health"
echo "   - View logs: docker-compose logs -f"
echo "   - Stop all: Press Ctrl+C or run docker-compose down"
echo ""

# Keep script running
wait $BACKEND_PID $FRONTEND_PID
