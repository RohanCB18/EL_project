import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

export const matchmakingPool = new Pool({
  host: process.env.MM_DB_HOST,
  port: process.env.MM_DB_PORT,
  database: process.env.MM_DB_NAME,
  user: process.env.MM_DB_USER,
  password: process.env.MM_DB_PASSWORD,
});

matchmakingPool.on("connect", () => {
  console.log("Matchmaking DB connected (PostgreSQL)");
});
