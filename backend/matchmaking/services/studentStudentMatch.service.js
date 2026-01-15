import { StudentModel } from "../models/Student.model.js";
import { MatchModel } from "../models/Match.model.js";
import { SemanticSimilarityService } from "./semanticSimilarity.service.js";

/**
 * Utility: overlap count between arrays
 */
const overlapCount = (a = [], b = []) =>
  a.filter(x => b.includes(x)).length;

/**
 * Build semantic text representation for a student
 */
const buildStudentSemanticText = (student) => {
  return `
    Domains: ${student.domain_interests?.join(", ") || ""}
    Skills: ${student.tech_skills?.join(", ") || ""}
    Languages: ${student.programming_languages?.join(", ") || ""}
    Past Projects: ${JSON.stringify(student.past_projects || "")}
  `;
};

/**
 * Student ↔ Student HYBRID Matching
 */
export const studentStudentMatch = async (currentStudentUSN) => {
  const current = await StudentModel.findByUSN(currentStudentUSN);
  if (!current) throw new Error("Student not found");

  const candidates = await StudentModel.findVisible();
  const results = [];

  const currentSemanticText = buildStudentSemanticText(current);

  for (const other of candidates) {
    if (other.usn === current.usn) continue;

    // ------------------
    // RULE-BASED SCORE
    // ------------------
    let ruleScore = 0;
    const reasons = [];

    const domainOverlap = overlapCount(
      current.domain_interests,
      other.domain_interests
    );
    if (domainOverlap > 0) {
      ruleScore += domainOverlap * 10;
      reasons.push("Common domain interests");
    }

    const skillOverlap = overlapCount(
      current.tech_skills,
      other.tech_skills
    );
    if (skillOverlap > 0) {
      ruleScore += skillOverlap * 8;
      reasons.push("Overlapping technical skills");
    }

    const langOverlap = overlapCount(
      current.programming_languages,
      other.programming_languages
    );
    if (langOverlap > 0) {
      ruleScore += langOverlap * 6;
      reasons.push("Common programming languages");
    }

    const yearDiff = Math.abs(current.year - other.year);
    if (yearDiff === 0) {
      ruleScore += 10;
      reasons.push("Same academic year");
    } else if (yearDiff === 1) {
      ruleScore += 5;
      reasons.push("Adjacent academic years");
    }

    if (
      current.project_completion_approach ===
      other.project_completion_approach
    ) {
      ruleScore += 8;
      reasons.push("Similar project work style");
    }

    if (
      current.commitment_preference ===
      other.commitment_preference
    ) {
      ruleScore += 6;
      reasons.push("Similar commitment preference");
    }

    // ------------------
    // SEMANTIC SCORE
    // ------------------
    const otherSemanticText = buildStudentSemanticText(other);
    const semanticScore =
      await SemanticSimilarityService.semanticScore(
        currentSemanticText,
        otherSemanticText
      );

    if (semanticScore > 60) {
      reasons.push("High semantic similarity in interests and experience");
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
        source_id: current.usn,
        target_type: "student",
        target_id: other.usn,
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
