const aiService = require('./aiService');

/**
 * Determine experience level from user profile data.
 */
function detectExperienceLevel(user, matchScore) {
    const expCount = (user.experience || []).length;
    const totalMonths = (user.experience || []).reduce((sum, exp) => {
        if (!exp.startDate) return sum;
        const start = new Date(exp.startDate);
        const end = exp.endDate && exp.endDate.toLowerCase() !== 'present'
            ? new Date(exp.endDate) : new Date();
        const months = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24 * 30)));
        return sum + months;
    }, 0);

    if (totalMonths === 0 && expCount === 0) return 'fresher';
    if (totalMonths <= 6) return 'intern';
    if (totalMonths <= 24) return 'junior';
    if (totalMonths <= 60) return 'mid';
    return 'senior';
}

/**
 * Generate categorized interview questions using AI.
 *
 * @param {Object} params
 * @param {Object} params.jobData        Parsed JD (job_title, company_name, skills_required, keywords)
 * @param {Object} params.resumeData     Generated ATS resume JSON (or user profile fallback)
 * @param {Object} params.user           Full user document
 * @param {Array}  params.matchedKeywords
 * @param {Array}  params.missingKeywords
 * @param {number} params.matchScore
 */
async function generateInterviewQuestions({ jobData, resumeData, user, matchedKeywords, missingKeywords, matchScore }) {
    const level = detectExperienceLevel(user, matchScore);

    const difficultyGuide = {
        fresher: 'Mostly Easy, some Medium. No Hard.',
        intern: 'Mix of Easy and Medium. 1-2 Hard.',
        junior: 'Mostly Medium. A few Easy and Hard.',
        mid: 'Mostly Medium and Hard. Very few Easy.',
        senior: 'Mostly Hard. Some Medium. No Easy.'
    };

    const userSkills = (user.skills || []).join(', ');
    const jdSkills = [...new Set([...(jobData.skills_required || []), ...(jobData.keywords || [])])].join(', ');

    // Find skills in JD that the user doesn't have
    const userSkillsLower = (user.skills || []).map(s => s.toLowerCase());
    const missingFromProfile = [...new Set([...(jobData.skills_required || []), ...(jobData.keywords || [])])]
        .filter(s => !userSkillsLower.includes(s.toLowerCase()));

    const projectsSummary = (user.projects || []).map(p =>
        `"${p.title}" — Tech: ${(p.technologies || []).join(', ')}. ${(p.description || []).join(' ')}`
    ).join('\n');

    const experienceSummary = (user.experience || []).map(e =>
        `${e.title} at ${e.company} (${e.startDate} – ${e.endDate}): ${(e.description || []).join(' ')}`
    ).join('\n');

    const prompt = `You are a senior technical interviewer preparing a realistic interview for a candidate.

TARGET ROLE: ${jobData.job_title}
COMPANY: ${jobData.company_name || 'Unknown'}
JD REQUIRED SKILLS: ${jdSkills}

CANDIDATE PROFILE:
- Skills: ${userSkills}
- Experience Level: ${level}
- ATS Match Score: ${matchScore || 0}%
- Matched Keywords: ${(matchedKeywords || []).join(', ')}
- Missing Keywords: ${(missingKeywords || []).join(', ')}
- Skills in JD but NOT in candidate profile: ${missingFromProfile.join(', ') || 'None'}

CANDIDATE EXPERIENCE:
${experienceSummary || 'No work experience listed.'}

CANDIDATE PROJECTS:
${projectsSummary || 'No projects listed.'}

DIFFICULTY CALIBRATION: ${difficultyGuide[level]}

GENERATION RULES:
1. Generate questions that a REAL interviewer at "${jobData.company_name || 'a tech company'}" would ask for a "${jobData.job_title}" role.
2. Technical questions must cover skills that MATCH between the JD and candidate — test depth, not breadth.
3. Project-based questions must reference the candidate's ACTUAL projects by name. Ask about their real architecture decisions, challenges, and trade-offs.
4. If the candidate has missing skills (listed above), create a separate "prepareForSkills" section with questions for each missing skill so the candidate knows what to study.
5. HR questions should be realistic and company-appropriate.
6. Scenario questions should test problem-solving for the specific role.
7. Coding questions should match the tech stack and difficulty level.
8. Every question MUST have all metadata fields filled — no empty strings.
9. Do NOT hallucinate technologies the candidate doesn't use.
10. Do NOT repeat questions across categories.

Return ONLY valid JSON in this exact format:
{
  "generatedQuestions": {
    "technical": [
      {
        "question": "Explain how React's reconciliation algorithm works and when it causes unnecessary re-renders.",
        "difficulty": "Medium",
        "topic": "React.js",
        "whyThisMatters": "Shows understanding of React internals beyond surface-level usage.",
        "expectedAnswerPoints": ["Virtual DOM diffing", "Key prop importance", "React.memo", "useMemo/useCallback"],
        "interviewerIntent": "Assess depth of React knowledge vs just knowing the API.",
        "tips": "Draw a diagram of the diffing process. Mention fiber architecture if you know it."
      }
    ],
    "hr": [],
    "projectBased": [],
    "scenario": [],
    "coding": []
  },
  "prepareForSkills": [
    {
      "skill": "TypeScript",
      "questions": [
        {
          "question": "What are generics in TypeScript and when would you use them?",
          "difficulty": "Medium",
          "topic": "TypeScript",
          "whyThisMatters": "TypeScript is required in the JD but not in your profile.",
          "expectedAnswerPoints": ["Type parameters", "Reusable components", "Type safety"],
          "interviewerIntent": "Check if candidate has any TypeScript exposure.",
          "tips": "Even basic understanding helps. Practice converting a JS function to use generics."
        }
      ]
    }
  ]
}

Generate:
- 6-8 technical questions (covering matched skills)
- 4-5 project-based questions (referencing actual projects)
- 4-5 HR questions
- 3-4 scenario questions
- 3-4 coding questions
- For each missing skill: 2-3 preparation questions
`;

    const result = await aiService.generateJSON(prompt, 'You are an expert technical interviewer and career coach. Generate realistic, role-specific interview questions.');

    return {
        generatedQuestions: result.generatedQuestions || {
            technical: [],
            hr: [],
            projectBased: [],
            scenario: [],
            coding: []
        },
        prepareForSkills: result.prepareForSkills || [],
        missingSkills: missingFromProfile,
        experienceLevel: level
    };
}

module.exports = { generateInterviewQuestions, detectExperienceLevel };
