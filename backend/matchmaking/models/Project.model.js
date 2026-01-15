import { matchmakingPool } from "../../config/db.js";

export const ProjectModel = {
  async create(project) {
    const query = `
      INSERT INTO projects (
        title, description,
        owner_type, owner_id,
        domain, tech_stack,
        project_type, expected_complexity,
        looking_for, is_active
      )
      VALUES (
        $1,$2,
        $3,$4,
        $5,$6,
        $7,$8,
        $9,$10
      )
      RETURNING *;
    `;

    const values = [
      project.title,
      project.description,
      project.owner_type,
      project.owner_id,
      project.domain,
      project.tech_stack,
      project.project_type,
      project.expected_complexity,
      project.looking_for,
      project.is_active ?? true
    ];

    const { rows } = await matchmakingPool.query(query, values);
    return rows[0];
  },

  async findActive() {
    const { rows } = await matchmakingPool.query(
      `SELECT * FROM projects WHERE is_active = TRUE`
    );
    return rows;
  },

  async findByOwner(ownerType, ownerId) {
    const { rows } = await matchmakingPool.query(
      `SELECT * FROM projects WHERE owner_type = $1 AND owner_id = $2`,
      [ownerType, ownerId]
    );
    return rows;
  },

    async updateActive(projectId, isActive) {
    await matchmakingPool.query(
      `UPDATE projects
       SET is_active = $1
       WHERE project_id = $2`,
      [isActive, projectId]
    );
  }
};
