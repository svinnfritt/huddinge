FROM node:22-alpine
WORKDIR /app
COPY . .
ENV NODE_NO_WARNINGS=1
EXPOSE 3000
CMD ["node", "server.js"]
