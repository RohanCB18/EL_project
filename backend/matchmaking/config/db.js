import pkg from "pg";
const { Pool } = pkg;

export const matchmakingPool = new Pool({
  user: "postgres",
  host: "10.248.74.22",
  database: "educonnect_matchmaking",
  password: "megha",
  port: 5432
});
