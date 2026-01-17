import { TeacherModel } from "../models/Teacher.model.js";
import { StudentModel } from "../models/Student.model.js";
import { MatchModel } from "../models/Match.model.js";
import { SemanticSimilarityService } from "./semanticSimilarity.service.js";

/**
 * Build semantic text for teacher
 */
const buildTeacherText = (teacher) => `
Expertise: ${teacher.areas_of_expertise?.join(", ") || ""}
Mentoring Domains: ${teacher.domains_interested_to_mentor?.join(", ") || ""}
Research: ${teacher.prominent_projects_or_publications?.join(", ") || ""}
`;

/**
 * Build semantic text for student
 */
const buildStudentText = (student) => `
Domains: ${student.domain_interests?.join(", ") || ""}
Skills: ${student.tech_skills?.join(", ") || ""}
Projects: ${JSON.stringify(student.past_projects || "")}
`;

/**
 * Teacher ↔ Student HYBRID MATCHING
 */
export const teacherStudentMatch = async (facultyId) => {
  const teacher = await TeacherModel.findById(facultyId);
  if (!teacher) throw new Error("Teacher not found");

  const students = await StudentModel.findVisible();
  const results = [];

  const teacherSemanticText = buildTeacherText(teacher);

  for (const student of students) {
    let ruleScore = 0;
    const reasons = [];

    // 1) preferred year match
    if (
      teacher.preferred_student_years?.includes(String(student.year))
    ) {
      ruleScore += 15;
      reasons.push("Student year matches mentor preference");
    }

    // 2) domain overlap
    const domainOverlap =
      student.domain_interests?.filter((d) =>
        teacher.domains_interested_to_mentor?.includes(d)
      ).length || 0;

    if (domainOverlap > 0) {
      ruleScore += domainOverlap * 10;
      reasons.push("Aligned project domains");
    }

    // 3) semantic score
    const studentSemanticText = buildStudentText(student);
    const semanticScore = await SemanticSimilarityService.semanticScore(
      teacherSemanticText,
      studentSemanticText
    );

    if (semanticScore > 60) {
      reasons.push("High semantic alignment with student profile");
    }

    const finalScore = Math.round(0.6 * ruleScore + 0.4 * semanticScore);

    if (finalScore > 0) {
      const match = {
        source_type: "teacher",
        source_id: teacher.faculty_id,
        target_type: "student",
        target_id: student.usn,
        match_score: finalScore,
        match_reason: reasons,

        // enriched student object for frontend
        student: {
          usn: student.usn,
          name: student.name,
          rvce_email: student.rvce_email,
          gender: student.gender,
          branch: student.branch,
          year: student.year,
          section: student.section,
          cgpa: student.cgpa,
          average_el_marks: student.average_el_marks,
          programming_languages: student.programming_languages,
          tech_skills: student.tech_skills,
          domain_interests: student.domain_interests,
          past_projects: student.past_projects,
          hackathon_participation_count:
            student.hackathon_participation_count,
          hackathon_achievement_level:
            student.hackathon_achievement_level,
          project_completion_approach:
            student.project_completion_approach,
          commitment_preference:
            student.commitment_preference
        }
      };

      results.push(match);

      // store in DB
      await MatchModel.create({
        source_type: match.source_type,
        source_id: match.source_id,
        target_type: match.target_type,
        target_id: match.target_id,
        match_score: match.match_score,
        match_reason: match.match_reason
      });
    }
  }

  results.sort((a, b) => b.match_score - a.match_score);
  return results;
};
