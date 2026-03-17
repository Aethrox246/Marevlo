FROM node:20

WORKDIR /app

COPY package*.json ./

RUN apt-get update \
  && apt-get install -y python3 \
  && ln -s /usr/bin/python3 /usr/local/bin/python \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g typescript && npm install --include=dev

COPY . .

RUN npm run build

EXPOSE 4002

CMD ["npm", "start"]
