import { StudentModel } from "../models/Student.model.js";
import { TeacherModel } from "../models/Teacher.model.js";
import { ProjectModel } from "../models/Project.model.js";
import { MatchModel } from "../models/Match.model.js";
import { SemanticSimilarityService } from "./semanticSimilarity.service.js";

/**
 * Build semantic text for project
 */
const buildProjectText = (project) => `
Title: ${project.title}
Description: ${project.description}
Domain: ${project.domain}
Tech Stack: ${project.tech_stack?.join(", ") || ""}
`;

/**
 * Build semantic text for student
 */
const buildStudentText = (student) => `
Domains: ${student.domain_interests?.join(", ") || ""}
Skills: ${student.tech_skills?.join(", ") || ""}
Languages: ${student.programming_languages?.join(", ") || ""}
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
 * Profile ↔ Project HYBRID MATCHING
 * profileType: "student" | "teacher"
 */
export const projectMatch = async (profileType, profileId) => {
  let profile;
  let profileText;

  if (profileType === "student") {
    profile = await StudentModel.findByUSN(profileId);
    profileText = buildStudentText(profile);
  } else {
    profile = await TeacherModel.findByFacultyId(profileId);
    profileText = buildTeacherText(profile);
  }

  if (!profile) throw new Error("Profile not found");

  const projects = await ProjectModel.findActive();
  const results = [];

  for (const project of projects) {
    let ruleScore = 0;
    const reasons = [];

    // 1️⃣ Domain match
    if (
      profile.domain_interests?.includes(project.domain) ||
      profile.domains_interested_to_mentor?.includes(project.domain)
    ) {
      ruleScore += 15;
      reasons.push("Project domain matches interests");
    }

    // 2️⃣ Tech stack overlap
    const techOverlap =
      project.tech_stack?.filter(t =>
        profile.tech_skills?.includes(t)
      ).length || 0;

    if (techOverlap > 0) {
      ruleScore += techOverlap * 8;
      reasons.push("Relevant technical skills for project");
    }

    // 3️⃣ Collaboration intent
    if (
      (profileType === "student" &&
        project.looking_for !== "mentor") ||
      (profileType === "teacher" &&
        project.looking_for !== "teammates")
    ) {
      ruleScore += 5;
      reasons.push("Project collaboration intent aligned");
    }

    // ------------------
    // SEMANTIC SCORE
    // ------------------
    const projectText = buildProjectText(project);
    const semanticScore =
      await SemanticSimilarityService.semanticScore(
        profileText,
        projectText
      );

    if (semanticScore > 60) {
      reasons.push("High semantic relevance to project description");
    }

    // ------------------
    // FINAL FUSION
    // ------------------
    const finalScore = Math.round(
      0.6 * ruleScore + 0.4 * semanticScore
    );

    if (finalScore > 0) {
      results.push({
        source_type: profileType,
        source_id:
          profileType === "student"
            ? profile.usn
            : profile.faculty_id,
        target_type: "project",
        target_id: project.project_id,
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
