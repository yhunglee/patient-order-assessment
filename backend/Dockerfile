FROM node:20.19.6-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY src ./src
EXPOSE 4000
CMD ["npm", "start"]
