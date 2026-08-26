import "dotenv/config";
import { createApp } from "./app.js";
import { createPool, createRepositories } from "./db.js";

const port = Number(process.env.PORT ?? 4000);
const pool = createPool(process.env.DATABASE_URL);
const app = createApp({
  repositories: createRepositories(pool),
  corsOrigin: process.env.CORS_ORIGIN,
});
app.listen(port, () =>
  console.log(`Patient Order API listening on port ${port}`),
);
