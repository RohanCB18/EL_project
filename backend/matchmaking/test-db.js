import { matchmakingPool } from "../config/db.js";

const testDB = async () => {
  try {
    const res = await matchmakingPool.query("SELECT NOW()");
    console.log("Matchmaking DB Time:", res.rows[0]);
  } catch (err) {
    console.error("DB Error:", err.message);
  } finally {
    process.exit(0);
  }
};

testDB();
