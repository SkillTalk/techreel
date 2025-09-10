# Use official Node LTS
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev || npm ci --only=production
COPY backend ./backend
ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000
CMD ["node", "backend/src/server.js"]
