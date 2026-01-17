import { matchmakingPool } from "../../config/db.js";

export const ProjectModel = {
  // =========================
  // CREATE PROJECT
  // =========================
  async create(project) {
    const query = `
      INSERT INTO projects (
        title, description, owner_type, owner_id,
        domain, tech_stack, project_type,
        expected_complexity, looking_for, is_active
      )
      VALUES (
        $1,$2,$3,$4,
        $5,$6,$7,
        $8,$9,$10
      )
      RETURNING *;
    `;

    const values = [
      project.title,
      project.description,
      project.owner_type,
      project.owner_id,
      project.domain,
      project.tech_stack || [], // text[]
      project.project_type,
      project.expected_complexity,
      project.looking_for, // must be "mentor" | "teammates" | "both"
      project.is_active ?? true
    ];

    const { rows } = await matchmakingPool.query(query, values);
    return rows[0];
  },

  // =========================
  // FIND PROJECTS BY OWNER
  // =========================
  async findByOwner(owner_type, owner_id) {
    const { rows } = await matchmakingPool.query(
      `SELECT * FROM projects
       WHERE owner_type = $1 AND owner_id = $2
       ORDER BY created_at DESC`,
      [owner_type, owner_id]
    );
    return rows;
  },

  // =========================
  // UPDATE PROJECT
  // =========================
  async update(projectId, project) {
    const query = `
      UPDATE projects
      SET
        title = $1,
        description = $2,
        domain = $3,
        tech_stack = $4,
        project_type = $5,
        expected_complexity = $6,
        looking_for = $7,
        is_active = $8
      WHERE project_id = $9
      RETURNING *;
    `;

    const values = [
      project.title,
      project.description,
      project.domain,
      project.tech_stack || [],
      project.project_type,
      project.expected_complexity,
      project.looking_for, // "mentor" | "teammates" | "both"
      project.is_active ?? true,
      projectId
    ];

    const { rows } = await matchmakingPool.query(query, values);
    return rows[0];
  },

  // =========================
  // DELETE PROJECT
  // =========================
  async delete(projectId) {
    await matchmakingPool.query(
      `DELETE FROM projects WHERE project_id = $1`,
      [projectId]
    );
  },
  
  async findOpenings(currentStudentUSN) {
  const mentorProjectsQuery = `
    SELECT *
    FROM projects
    WHERE owner_type = 'teacher'
      AND is_active = TRUE
    ORDER BY created_at DESC
  `;

  const studentOpeningsQuery = `
    SELECT *
    FROM projects
    WHERE owner_type = 'student'
      AND is_active = TRUE
      AND owner_id <> $1
      AND looking_for IN ('teammates', 'both')
    ORDER BY 
      CASE 
        WHEN looking_for = 'both' THEN 1
        WHEN looking_for = 'teammates' THEN 2
        ELSE 3
      END,
      created_at DESC
  `;

  const mentorProjects = await matchmakingPool.query(mentorProjectsQuery);
  const studentOpenings = await matchmakingPool.query(studentOpeningsQuery, [
    currentStudentUSN
  ]);

  return {
    mentorProjects: mentorProjects.rows,
    studentOpenings: studentOpenings.rows
  };
}


};


