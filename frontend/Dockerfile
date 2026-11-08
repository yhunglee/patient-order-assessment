# Optional original npm tarball cache: --build-context npm-cache=/path/to/cache
FROM scratch AS npm-cache
FROM node:24.22.1-bookworm-slim@sha256:be8204d4bd327363357f532187b752ff62759c31bedf98e9e18fc08c9cbd605c
WORKDIR /app
COPY --chown=node:node package*.json ./
RUN --mount=type=bind,from=npm-cache,target=/npm-cache \
    if [ -d /npm-cache/_cacache ]; then \
      cp -a /npm-cache /tmp/npm-cache && npm ci --offline --cache /tmp/npm-cache; \
    else npm ci; fi && rm -rf /tmp/npm-cache /root/.npm
COPY --chown=node:node . .
RUN npm run build
# 正式程序使用非 root 帳號；前端需能寫入 Next.js 執行快取。
RUN chown -R node:node /app/.next
USER node
EXPOSE 3000
CMD ["npm", "start"]
