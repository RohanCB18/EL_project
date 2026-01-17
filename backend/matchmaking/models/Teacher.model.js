import { matchmakingPool } from "../../config/db.js";

export const TeacherModel = {
  // =========================
  // CREATE TEACHER
  // =========================
  async create(teacher) {
    const query = `
      INSERT INTO teachers (
        faculty_id, name, rvce_email, department,
        years_of_experience, areas_of_expertise,
        domains_interested_to_mentor,
        prominent_projects_or_publications,
        publication_and_count,
        mentoring_style, preferred_student_years,
        max_projects_capacity, is_visible_for_matching
      )
      VALUES (
        $1,$2,$3,$4,
        $5,$6,
        $7,
        $8,
        $9,
        $10,$11,
        $12,$13
      )
      RETURNING *;
    `;

    const values = [
      teacher.faculty_id,
      teacher.name,
      teacher.rvce_email,
      teacher.department,
      teacher.years_of_experience,
      teacher.areas_of_expertise,
      teacher.domains_interested_to_mentor,
      teacher.prominent_projects_or_publications,
      teacher.publication_and_count,
      teacher.mentoring_style,
      teacher.preferred_student_years,
      teacher.max_projects_capacity,
      teacher.is_visible_for_matching
    ];

    const { rows } = await matchmakingPool.query(query, values);
    return rows[0];
  },

  // =========================
  // FIND BY FACULTY ID
  // =========================
  async findByFacultyId(facultyId) {
    const { rows } = await matchmakingPool.query(
      `SELECT * FROM teachers WHERE faculty_id = $1`,
      [facultyId]
    );
    return rows[0];
  },

  // alias (so we can use TeacherModel.findById too)
  async findById(faculty_id) {
    const { rows } = await matchmakingPool.query(
      `SELECT * FROM teachers WHERE faculty_id = $1`,
      [faculty_id]
    );
    return rows[0];
  },

  // =========================
  // FIND ALL VISIBLE TEACHERS
  // =========================
  async findVisible() {
    const { rows } = await matchmakingPool.query(
      `SELECT * FROM teachers WHERE is_visible_for_matching = TRUE`
    );
    return rows;
  },

  // =========================
  // UPDATE VISIBILITY
  // =========================
  async updateVisibility(facultyId, isVisible) {
    await matchmakingPool.query(
      `UPDATE teachers
       SET is_visible_for_matching = $1
       WHERE faculty_id = $2`,
      [isVisible, facultyId]
    );
  }
};
