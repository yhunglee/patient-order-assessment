# Patient Order Assessment

以 **React (Next.js) + Material UI、Node.js + Express、PostgreSQL** 實作的 Patient／Order 技術前測專案。

## 功能

- 顯示固定 seed 的 5 位 Patient。
- 點選 Patient 後開啟 Dialog，查看目前的 Order。
- Dialog 右上角依資料狀態提供 **新增 Order** 或 **編輯** 操作。
- Order 可回存；前後端皆驗證內容不可空白、長度最多 500 字。
- 手機、平板與桌面 RWD：清單使用 `xs=12 / sm=6 / md=4`，Dialog 在窄螢幕維持可用邊界與大型點擊區。
- Express 採 route + repository 分層；資料庫使用 transaction 保護新增 Order 與 Patient 關聯更新。

## 資料模型與題意解讀

題目提供的格式為 `patients[].OrderId`（單一 scalar），而非 orders array 或 linking table。因此本專案實作為：

```text
Patient 0..1 ── 1 Order
```

一位 Patient 只有一筆「目前有效」的 Order。尚未有 Order 時，右上角顯示「新增 Order」；已有 Order 時顯示「編輯」。`patients.order_id` 使用 foreign key 與 `UNIQUE` constraint，讓資料庫也維持這個規則，而非僅由前端控制。

## 架構

```text
Browser
  └─ Next.js / React Hooks / MUI (3000)
       └─ REST API
            └─ Express (4000)
                 └─ PostgreSQL (5432, Docker internal)
```

## 本機開發（Docker Desktop 尚未可用時）

需要 Node `20.19.6`（專案 `.nvmrc` 已指定）。

```bash
nvm use
npm install
npm install --prefix backend
npm install --prefix frontend
npm run dev
```

前端：<http://localhost:3000>  
後端 health check：<http://localhost:4000/health>

> 後端須有可連線的 PostgreSQL；可從 `backend/.env.example` 建立 `backend/.env`，填入本機 `DATABASE_URL`。完整可重現資料庫與 seed 的推薦方式是下方 Docker Compose。

## Docker Compose（正式驗收流程）

前置：Docker Desktop → **Settings → Resources → WSL Integration** 啟用目前 WSL distro，並重開 WSL shell，確認 `docker --version` 有輸出。

```bash
docker compose up --build
```

首次建立 PostgreSQL volume 時會自動執行 `db/init.sql`，產生 5 位 Patient 與 5 筆 Order；每位 Patient 各有一筆可編輯的初始醫囑。

驗收後停止：

```bash
docker compose down
```

若要連資料一併重建 seed：

```bash
docker compose down -v
docker compose up --build
```

## API

- `GET /health`
- `GET /api/patients`
- `POST /api/patients/:patientId/orders` body: `{ "message": "..." }`
- `PUT /api/orders/:orderId` body: `{ "message": "..." }`

回應錯誤使用適當 HTTP status：驗證失敗 `400`、不存在 `404`、對已有醫囑的 Patient 再新增 `409`。

## 驗證

```bash
npm test
npm run lint
npm run build --prefix frontend
```

## GitHub 發布（Public）

此 repo 設計為 Public，方便 reviewer clone。由 repo owner 在 GitHub 建立空白的 `patient-order-assessment` public repository 後：

```bash
git remote add origin https://github.com/<OWNER>/patient-order-assessment.git
git branch -M main
git push -u origin main
```

請勿在 GitHub 建 repo 時自動加入 README、.gitignore 或 license，以避免第一個 push 需要處理額外歷史。
