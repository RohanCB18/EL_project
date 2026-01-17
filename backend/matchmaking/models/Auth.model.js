import { matchmakingPool } from "../config/db.js";
const pool = matchmakingPool;
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export const AuthModel = {
  async signup({ user_type, user_id, password }) {
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const query = `
      INSERT INTO users (user_type, user_id, password_hash)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_type, user_id)
      DO NOTHING
      RETURNING user_type, user_id
    `;

    const values = [user_type, user_id, password_hash];
    const result = await pool.query(query, values);

    return result.rows[0] || null; // null means already exists
  },

  async login({ user_type, user_id, password }) {
    const query = `
      SELECT user_type, user_id, password_hash
      FROM users
      WHERE user_type = $1 AND user_id = $2
    `;

    const result = await pool.query(query, [user_type, user_id]);
    const user = result.rows[0];

    if (!user) return { ok: false, error: "User not found" };

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return { ok: false, error: "Invalid password" };

    return { ok: true, user: { user_type: user.user_type, user_id: user.user_id } };
  }
};
