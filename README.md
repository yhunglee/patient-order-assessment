# Patient Order Assessment

以 **React (Next.js) + Material UI、Node.js + Express、PostgreSQL** 實作的 Patient／Order 技術前測專案。

## 功能畫面預覽

### 病人清單

![病人清單與目前醫囑狀態](screenshots/list-patients.png)

### 查看目前醫囑與歷史版本

![醫囑唯讀畫面與歷史醫囑](screenshots/order-detail.png)

### 新增、編輯與儲存醫囑

![新增醫囑](screenshots/order-creating.png)

![編輯醫囑](screenshots/order-editing.png)

![儲存成功後顯示最新醫囑與建立時間](screenshots/order-saved.png)

## 功能

- 顯示固定 seed 的 5 位 Patient。
- 點選 Patient 後開啟 Dialog，查看目前最新的 Order 與建立時間。
- Dialog 右上角依資料狀態提供 **新增醫囑** 或 **編輯** 操作。
- 儲存修改時不會覆寫既有資料，而是建立一筆新的醫囑版本；儲存成功後立即顯示最新醫囑與時間。
- 唯讀模式提供預設收合的「歷史醫囑」列表，依建立日期／時間由新到舊排列。
- Order 可回存；前後端皆驗證內容不可空白、長度最多 500 字。
- 手機、平板與桌面 RWD：清單使用 `xs=12 / sm=6 / md=4`，Dialog 在窄螢幕維持可用邊界與大型點擊區。
- Express 採 route + repository 分層；資料庫使用 transaction 保護醫囑版本新增作業。

## 資料模型與題意解讀

本功能調整為病人與醫囑的一對多關係：

```text
Patient 1 ── 0..N Order
```

`orders.patient_id` 是外鍵。每次新增或修改都會新增一筆 `orders` 資料，既有醫囑不會被覆寫；依 `created_at DESC, id DESC` 的第一筆為目前最新醫囑，其餘即為歷史紀錄。

## 架構

```text
Browser
  └─ Next.js / React Hooks / MUI (3000)
       └─ REST API
            └─ Express (4000)
                 └─ PostgreSQL (5432, Docker internal)
```

## 本機開發（Docker Desktop 尚未可用時）

需要 Node `24.22.1`（專案 `.nvmrc` 已指定）。

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

Node builder/runtime 使用固定 digest 的 `node:24.22.1-bookworm-slim`（Debian/glibc）；資料庫使用 `postgres:16-bookworm`。
前後端以非 root 的 `node` 帳號執行，Docker COPY 明確設定檔案擁有者，前端另保留 `.next` 快取寫入權限。

若 npm registry 下載停滯，可選擇提供包含原始 npm `_cacache` 的目錄（不是 `node_modules`）：

```bash
docker build --build-context npm-cache="$HOME/.npm" \
  -t patient-order-frontend:node24-debian ./frontend
```

此選項使用 `npm ci --offline`，保留 lockfile／integrity 驗證；缺少必要 tarball 時會失敗，不會複製主機安裝結果。
未提供 cache context 時，Compose／一般 build 仍使用線上的 `npm ci`。快取只在安裝層暫存並於同層刪除。

### 從 Alpine 資料庫搬遷：必須 dump / restore

**不可把原 Alpine/musl 的 PostgreSQL data directory 或 volume 直接掛到 Debian/glibc 容器。**
即使 PostgreSQL major version 同為 16，libc / locale / collation 的差異也可能影響排序與索引。
Compose 已改用新的 `postgres-data-debian` volume key；不要將它指向舊 volume，也不要刪除舊資料作為搬遷步驟。
有既有資料時，先在舊資料庫仍正常運作時建立邏輯備份，再安排切換：

```bash
# 在寫入停止的維護時段執行；替換成現有 Alpine DB container 的真實名稱。
OLD_DB_CONTAINER=your-existing-alpine-postgres-container
docker exec "$OLD_DB_CONTAINER" pg_dump -U patient_order -d patient_order -Fc > patient-order-alpine.dump
# 確認上一行成功，並驗證備份目錄；確認備份安全後才進行切換。
docker exec -i "$OLD_DB_CONTAINER" pg_restore --list < patient-order-alpine.dump

# 確保這個 project name 尚未使用；不要連接任何既有 volume。
# 只啟動新 DB，不改動舊服務；新 DB 不對 host 發布 port。
docker compose -p patient-order-debian-migration up -d --wait postgres
# 新 volume 會先跑 init.sql；--clean 清除其中的同名 seed 物件，再還原備份。
docker compose -p patient-order-debian-migration exec -T postgres \
  pg_restore -U patient_order -d patient_order --clean --if-exists --no-owner --exit-on-error \
  < patient-order-alpine.dump
docker compose -p patient-order-debian-migration exec -T postgres \
  psql -U patient_order -d patient_order -v ON_ERROR_STOP=1 \
  -c 'ANALYZE; SELECT count(*) AS patients FROM patients; SELECT count(*) AS orders FROM orders;'
```

確認還原資料與舊 DB 筆數、醫囑歷史及排序一致後，才安排停止舊應用並以同一個新 project name
啟動 backend/frontend（`docker compose -p patient-order-debian-migration up --build -d`）；
預設 host ports 3000/4000 必須先釋出或另以 override 調整。保留舊 volume 與 dump 作為回復依據。
若有自訂資料庫角色，另以 `pg_dumpall --globals-only` 備份並審核／還原所需角色；上述流程針對本專案預設單一角色。
以下一般啟動指令只適用於全新資料或已規劃好的切換，並非現有 Alpine DB 的直接升級指令。


前置：Docker Desktop → **Settings → Resources → WSL Integration** 啟用目前 WSL distro，並重開 WSL shell，確認 `docker --version` 有輸出。

```bash
docker compose up --build
```

首次建立 PostgreSQL volume 時會自動執行 `db/init.sql`，產生 5 位 Patient，且僅小民有 1 筆初始 Order；其餘病人可從 Dialog 新增醫囑。

> 已使用舊版 `patients.order_id` schema 的資料庫，請在部署新版後先執行 `db/migrations/001_patient_order_history.sql`。此 migration 會保留既有醫囑、補上 `orders.patient_id`，並移除舊的一對一關聯。

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
- `PUT /api/orders/:orderId` body: `{ "message": "..." }`（建立新的醫囑版本，不覆寫原資料）

回應錯誤使用適當 HTTP status：驗證失敗 `400`、不存在 `404`。

## 驗證

```bash
npm test
npm run lint
npm run build --prefix frontend
```
