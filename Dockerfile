FROM node:20-alpine

WORKDIR /app

# Install dependencies first to maximize Docker layer caching.
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the application source after dependencies are installed.
COPY . .

ENV NODE_ENV=production
EXPOSE 3000

# Start the Express app.
CMD ["npm", "start"]
