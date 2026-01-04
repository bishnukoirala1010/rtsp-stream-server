FROM node:18-slim

# Install FFmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY . .

# Create public directory
RUN mkdir -p public/stream

# Expose port
EXPOSE 10000

# Start application
CMD ["npm", "start"]
