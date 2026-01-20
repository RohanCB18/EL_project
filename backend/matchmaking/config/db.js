import pkg from "pg";
const { Pool } = pkg;

export const matchmakingPool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "educonnect_matchmaking",
  password: "megha",
  port: 5432
});
