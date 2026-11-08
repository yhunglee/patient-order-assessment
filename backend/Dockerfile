FROM node:24.22.1-bookworm-slim@sha256:be8204d4bd327363357f532187b752ff62759c31bedf98e9e18fc08c9cbd605c
WORKDIR /app
COPY --chown=node:node package*.json ./
RUN npm ci
COPY --chown=node:node src ./src
# 正式 API 程序使用非 root 帳號，不授予系統目錄寫入權限。
USER node
EXPOSE 4000
CMD ["npm", "start"]
