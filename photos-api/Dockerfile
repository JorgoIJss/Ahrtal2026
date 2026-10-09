FROM node:22-alpine
WORKDIR /app
COPY photos-api/package*.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY photos-api/server.mjs ./server.mjs
ENV NODE_ENV=production PORT=3000 DATA_DIR=/data
EXPOSE 3000
CMD ["node","server.mjs"]
