# Use Node.js 20 LTS with Debian base (better compatibility for canvas)
FROM node:20-bullseye

# Install system dependencies for canvas, PDF processing, and OCR
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    libpng-dev \
    pkg-config \
    python3 \
    poppler-utils \
    graphicsmagick \
    tesseract-ocr \
    tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port (Railway will override with PORT env var)
EXPOSE 3005

# Start the application
CMD ["npm", "start"]
