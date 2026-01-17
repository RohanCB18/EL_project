import { matchmakingPool } from "../../config/db.js";

export const TeacherModel = {
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
      teacher.areas_of_expertise || [],
      teacher.domains_interested_to_mentor || [],
      teacher.prominent_projects_or_publications || [],
      teacher.publication_and_count,
      teacher.mentoring_style,
      teacher.preferred_student_years || [],
      teacher.max_projects_capacity,
      teacher.is_visible_for_matching ?? true
    ];

    const { rows } = await matchmakingPool.query(query, values);
    return rows[0];
  },

  async upsert(teacher) {
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
      ON CONFLICT (faculty_id) DO UPDATE SET
        name = EXCLUDED.name,
        rvce_email = EXCLUDED.rvce_email,
        department = EXCLUDED.department,
        years_of_experience = EXCLUDED.years_of_experience,
        areas_of_expertise = EXCLUDED.areas_of_expertise,
        domains_interested_to_mentor = EXCLUDED.domains_interested_to_mentor,
        prominent_projects_or_publications = EXCLUDED.prominent_projects_or_publications,
        publication_and_count = EXCLUDED.publication_and_count,
        mentoring_style = EXCLUDED.mentoring_style,
        preferred_student_years = EXCLUDED.preferred_student_years,
        max_projects_capacity = EXCLUDED.max_projects_capacity,
        is_visible_for_matching = EXCLUDED.is_visible_for_matching
      RETURNING *;
    `;

    const values = [
      teacher.faculty_id,
      teacher.name,
      teacher.rvce_email,
      teacher.department,
      teacher.years_of_experience,
      teacher.areas_of_expertise || [],
      teacher.domains_interested_to_mentor || [],
      teacher.prominent_projects_or_publications || [],
      teacher.publication_and_count,
      teacher.mentoring_style,
      teacher.preferred_student_years || [],
      teacher.max_projects_capacity,
      teacher.is_visible_for_matching ?? true
    ];

    const { rows } = await matchmakingPool.query(query, values);
    return rows[0];
  },

  async findById(faculty_id) {
    const { rows } = await matchmakingPool.query(
      `SELECT * FROM teachers WHERE faculty_id = $1`,
      [faculty_id]
    );
    return rows[0];
  },

  async findVisible() {
    const { rows } = await matchmakingPool.query(
      `SELECT * FROM teachers WHERE is_visible_for_matching = TRUE`
    );
    return rows;
  },

  async updateVisibility(facultyId, isVisible) {
    await matchmakingPool.query(
      `UPDATE teachers
       SET is_visible_for_matching = $1
       WHERE faculty_id = $2`,
      [isVisible, facultyId]
    );
  }
};
