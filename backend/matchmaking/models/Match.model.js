import { matchmakingPool } from "../../config/db.js";

export const MatchModel = {
  async create(match) {
    const query = `
      INSERT INTO matches (
        source_type, source_id,
        target_type, target_id,
        match_score, match_reason
      )
      VALUES (
        $1,$2,
        $3,$4,
        $5,$6
      )
      RETURNING *;
    `;

    const values = [
      match.source_type,
      match.source_id,
      match.target_type,
      match.target_id,
      match.match_score,
      match.match_reason
    ];

    const { rows } = await matchmakingPool.query(query, values);
    return rows[0];
  },

  async findBySource(sourceType, sourceId) {
    const { rows } = await matchmakingPool.query(
      `SELECT * FROM matches
       WHERE source_type = $1 AND source_id = $2
       ORDER BY match_score DESC`,
      [sourceType, sourceId]
    );
    return rows;
  }
};
