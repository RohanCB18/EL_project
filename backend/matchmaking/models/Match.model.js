import { matchmakingPool } from "../../config/db.js";

export const MatchModel = {
  async create(match) {
    const query = `
      INSERT INTO matches (
        source_type, source_id,
        target_type, target_id,
        match_score, match_reason
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *;
    `;

    const values = [
      match.source_type,
      match.source_id,
      match.target_type,
      match.target_id,
      match.match_score,
      match.match_reason || [] // ✅ send array directly (NOT JSON.stringify)
    ];

    const { rows } = await matchmakingPool.query(query, values);
    return rows[0];
  }
};
