import { StudentModel } from "../models/Student.model.js";
import { TeacherModel } from "../models/Teacher.model.js";
import { MatchModel } from "../models/Match.model.js";
import { SemanticSimilarityService } from "./semanticSimilarity.service.js";

/**
 * Build semantic text for student
 */
const buildStudentText = (student) => `
Domains: ${student.domain_interests?.join(", ") || ""}
Skills: ${student.tech_skills?.join(", ") || ""}
Projects: ${JSON.stringify(student.past_projects || "")}
`;

/**
 * Build semantic text for teacher
 */
const buildTeacherText = (teacher) => `
Expertise: ${teacher.areas_of_expertise?.join(", ") || ""}
Mentoring Domains: ${teacher.domains_interested_to_mentor?.join(", ") || ""}
Research: ${teacher.prominent_projects_or_publications?.join(", ") || ""}
`;

/**
 * Student ↔ Teacher HYBRID MATCHING
 */
export const studentTeacherMatch = async (studentUSN) => {
  const student = await StudentModel.findByUSN(studentUSN);
  if (!student) throw new Error("Student not found");

  const teachers = await TeacherModel.findVisible();
  const results = [];

  const studentSemanticText = buildStudentText(student);

  for (const teacher of teachers) {
    let ruleScore = 0;
    const reasons = [];

    // 1️⃣ Preferred student year
    if (
      teacher.preferred_student_years?.includes(
        String(student.year)
      )
    ) {
      ruleScore += 15;
      reasons.push("Preferred student year for mentoring");
    }

    // 2️⃣ Domain interest overlap
    const domainOverlap =
      student.domain_interests?.filter(d =>
        teacher.domains_interested_to_mentor?.includes(d)
      ).length || 0;

    if (domainOverlap > 0) {
      ruleScore += domainOverlap * 10;
      reasons.push("Aligned mentoring domains");
    }

    // 3️⃣ Capacity check (soft rule)
    if (teacher.max_projects_capacity > 0) {
      ruleScore += 5;
      reasons.push("Mentor has available capacity");
    }

    // ------------------
    // SEMANTIC SCORE
    // ------------------
    const teacherSemanticText = buildTeacherText(teacher);
    const semanticScore =
      await SemanticSimilarityService.semanticScore(
        studentSemanticText,
        teacherSemanticText
      );

    if (semanticScore > 60) {
      reasons.push("High semantic alignment with mentor expertise");
    }

    // ------------------
    // FINAL FUSION
    // ------------------
    const finalScore = Math.round(
      0.6 * ruleScore + 0.4 * semanticScore
    );

    if (finalScore > 0) {
      results.push({
        source_type: "student",
        source_id: student.usn,
        target_type: "teacher",
        target_id: teacher.faculty_id,
        match_score: finalScore,
        match_reason: reasons
      });
    }
  }

  results.sort((a, b) => b.match_score - a.match_score);

  for (const match of results) {
    await MatchModel.create(match);
  }

  return results;
};
