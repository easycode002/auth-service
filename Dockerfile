# BUILD STAGE
FROM node:20-alpine3.19 as builder

WORKDIR /app
COPY package.json ./

RUN npm install

COPY tsconfig.json nodemon.json tsoa.json build-script.js ecosystem.config.js ./
COPY src ./src

RUN npm run build

# FINAL STAGE
FROM node:20-alpine3.19

WORKDIR /app

COPY package.json ./
RUN npm install --only=production

# COPY THE BUILD APPLICATION FROM BUILD STAGE
COPY --from=builder /app/build/ .

# EXPOSE THE PORT THE APP RUN ON
EXPOSE 4001

# COMMAND TO RUN THE APPLICATION
CMD["node","server.js"]