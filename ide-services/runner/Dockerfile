FROM node:20-slim

WORKDIR /app

# Install compilers needed for native code execution
RUN apt-get update \
  && apt-get install -y \
     python3 \
     g++ \
     openjdk-17-jdk \
  && ln -s /usr/bin/python3 /usr/local/bin/python \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install -g typescript && npm install --include=dev

COPY . .

RUN npm run build

# Create non-root user for security
RUN useradd -m -u 1001 appuser
USER appuser

EXPOSE 4002

CMD sh -c "npm start -- --port ${PORT:-4002}"
