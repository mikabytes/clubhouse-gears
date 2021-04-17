FROM node:15-alpine
EXPOSE 80
WORKDIR /app
COPY package*.json ./
COPY src ./src
RUN npm install
CMD ["npm", "start"]
