FROM node:20-slim

WORKDIR /app

# ── System packages ────────────────────────────────────────────────────────────
# python3-dev: for os.fork() + resource module (both stdlib, just need the runtime)
# openjdk-17-jdk: javac + java
# g++: C++ compiler
RUN apt-get update && apt-get install -y \
      python3 \
      g++ \
      openjdk-17-jdk \
    && ln -sf /usr/bin/python3 /usr/local/bin/python \
    && rm -rf /var/lib/apt/lists/*

# ── Pre-generate JVM Class Data Sharing archive ────────────────────────────────
# This bakes the bootstrap class-loading work once at build time so every
# subsequent `java` invocation can share the mapping.  The archive lives at
# /tmp/jvm.jsa and is referenced via -XX:SharedArchiveFile in JVM_FLAGS.
# If this step fails (e.g. on an unusual platform) the image still works;
# the flag is simply ignored when the file is absent.
RUN java -Xshare:dump -XX:SharedArchiveFile=/tmp/jvm.jsa 2>/dev/null || true

# ── Node deps ─────────────────────────────────────────────────────────────────
COPY package*.json ./
RUN npm install -g typescript && npm install --include=dev

# ── Source ────────────────────────────────────────────────────────────────────
COPY . .
RUN npm run build

# ── Compile-cache volume ───────────────────────────────────────────────────────
# Mount a named volume here in docker-compose so the cache survives container
# restarts.  Set COMPILE_CACHE_DIR to any path you like.
ENV COMPILE_CACHE_DIR=/cache/compile
RUN mkdir -p /cache/compile
VOLUME ["/cache"]

# ── Python pool size ──────────────────────────────────────────────────────────
# More workers = more concurrent Python executions without queuing.
# Keep it ≤ (number of CPU cores) for best throughput.
ENV PYTHON_POOL_SIZE=6
ENV MAX_CONCURRENT=20

# ── Non-root user ─────────────────────────────────────────────────────────────
RUN useradd -m -u 1001 appuser && chown -R appuser /cache
USER appuser

EXPOSE 4002

CMD sh -c "npm start -- --port ${PORT:-4002}"
