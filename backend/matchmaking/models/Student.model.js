import { matchmakingPool } from "../../config/db.js";

export const StudentModel = {

  async setPasswordHash(usn, password_hash) {
  const { rows } = await matchmakingPool.query(
    `UPDATE students SET password_hash = $1 WHERE usn = $2 RETURNING usn, name`,
    [password_hash, usn]
  );
  return rows[0];
},

  // =========================
  // CREATE
  // =========================
  async create(student) {
    const query = `
      INSERT INTO students (
        usn, name, rvce_email, branch, year, section,
        cgpa, average_el_marks, gender, residence,
        project_completion_approach, commitment_preference,
        programming_languages, tech_skills, domain_interests,
        past_projects, hackathon_participation_count,
        hackathon_achievement_level, is_visible_for_matching
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,
        $7,$8,$9,$10,
        $11,$12,
        $13,$14,$15,
        $16,$17,$18,$19
      )
      RETURNING *;
    `;

    const values = [
      student.usn,
      student.name,
      student.rvce_email,
      student.branch,
      student.year,
      student.section,
      student.cgpa,
      student.average_el_marks,
      student.gender,
      student.residence,
      student.project_completion_approach,
      student.commitment_preference,
      student.programming_languages || [],
      student.tech_skills || [],
      student.domain_interests || [],
      JSON.stringify(student.past_projects || {}),
      student.hackathon_participation_count,
      student.hackathon_achievement_level,
      student.is_visible_for_matching ?? true
    ];

    const { rows } = await matchmakingPool.query(query, values);
    return rows[0];
  },

  // =========================
  // UPSERT
  // =========================
  async upsert(student) {
    const query = `
      INSERT INTO students (
        usn, name, rvce_email, branch, year, section,
        cgpa, average_el_marks, gender, residence,
        project_completion_approach, commitment_preference,
        programming_languages, tech_skills, domain_interests,
        past_projects, hackathon_participation_count,
        hackathon_achievement_level, is_visible_for_matching
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,
        $7,$8,$9,$10,
        $11,$12,
        $13,$14,$15,
        $16,$17,$18,$19
      )
      ON CONFLICT (usn) DO UPDATE SET
        name = EXCLUDED.name,
        rvce_email = EXCLUDED.rvce_email,
        branch = EXCLUDED.branch,
        year = EXCLUDED.year,
        section = EXCLUDED.section,
        cgpa = EXCLUDED.cgpa,
        average_el_marks = EXCLUDED.average_el_marks,
        gender = EXCLUDED.gender,
        residence = EXCLUDED.residence,
        project_completion_approach = EXCLUDED.project_completion_approach,
        commitment_preference = EXCLUDED.commitment_preference,
        programming_languages = EXCLUDED.programming_languages,
        tech_skills = EXCLUDED.tech_skills,
        domain_interests = EXCLUDED.domain_interests,
        past_projects = EXCLUDED.past_projects,
        hackathon_participation_count = EXCLUDED.hackathon_participation_count,
        hackathon_achievement_level = EXCLUDED.hackathon_achievement_level,
        is_visible_for_matching = EXCLUDED.is_visible_for_matching;
    `;

    const values = [
      student.usn,
      student.name,
      student.rvce_email,
      student.branch,
      student.year,
      student.section,
      student.cgpa,
      student.average_el_marks,
      student.gender,
      student.residence,
      student.project_completion_approach,
      student.commitment_preference,
      student.programming_languages || [],
      student.tech_skills || [],
      student.domain_interests || [],
      JSON.stringify(student.past_projects || {}),
      student.hackathon_participation_count,
      student.hackathon_achievement_level,
      student.is_visible_for_matching ?? true
    ];

    await matchmakingPool.query(query, values);
  },

  // =========================
  // READ HELPERS
  // =========================
  async findVisible() {
    const { rows } = await matchmakingPool.query(
      `SELECT * FROM students WHERE is_visible_for_matching = TRUE`
    );
    return rows;
  },

  async findByUSN(usn) {
    const { rows } = await matchmakingPool.query(
      `SELECT * FROM students WHERE usn = $1`,
      [usn]
    );
    return rows[0];
  },

  // =========================
  // VISIBILITY TOGGLE
  // =========================
  async updateVisibility(usn, isVisible) {
    await matchmakingPool.query(
      `UPDATE students
       SET is_visible_for_matching = $1
       WHERE usn = $2`,
      [isVisible, usn]
    );
  }
};
