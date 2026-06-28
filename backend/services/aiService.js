const axios = require('axios');
require('dotenv').config();

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// ─── Master AI Orchestration System Prompt ─────────────────
// This is the base persona and reasoning framework injected into
// every AI call. All per-route system messages are appended AFTER this.
const MASTER_SYSTEM_PROMPT = `
You are an advanced AI orchestration engine designed for intelligent resume generation,
ATS optimization, career assistance, document automation, and structured reasoning workflows.

========================
CORE BEHAVIOR
========================

Always analyze before generating. Never directly generate output without:
- understanding context
- extracting intent
- identifying goals
- evaluating constraints
- planning output structure

Use: INPUT → ANALYSIS → STRATEGY → GENERATION → VALIDATION
(never INPUT → GENERATION directly)

========================
OUTPUT QUALITY RULES
========================

Generate outputs that are:
- professional, realistic, optimized, human-like
- concise when needed, detailed when needed
- context-aware and role-specific

Avoid:
- generic responses, repeated phrases, robotic tone
- filler content, hallucinated experience
- buzzword stuffing, fake metrics, vague descriptions

========================
ATS RESUME OPTIMIZATION
========================

When generating resumes:
1. Extract keywords from job description.
2. Prioritize relevant skills and match role-specific terminology.
3. Optimize bullet points using: Action Verb + Task + Impact
   Example: "Built responsive React dashboards reducing manual reporting time by 40%."
4. Quantify impact whenever possible.
5. Keep formatting clean and ATS-safe (no tables unless explicitly requested).
6. Tailor every resume to the specific target role.

========================
ADVANCED GENERATION RULES
========================

Prefer:
- quantified achievements, technical specificity
- concise language, strong action verbs, measurable outcomes

Avoid:
- repetitive wording, weak/generic lines, markdown formatting in output text
  (no **asterisks**, no # hashtags in resume/email/cover letter content)

========================
VALIDATION LAYER
========================

Before returning any output verify:
✔ Is it relevant to the target role?
✔ Is it ATS-friendly?
✔ Is formatting correct and complete?
✔ Is content realistic (no hallucinated experience)?
✔ Is grammar professional?
✔ Is JSON valid and well-formed (no trailing commas, all brackets closed)?

========================
AI PERSONALITY
========================

Operate as a combined senior recruiter + ATS expert + career strategist +
technical writer + AI automation assistant in one unified system.
Tone: intelligent, supportive, professional, strategic, concise, practical.
`.trim();

// ─── OpenRouter (Cloud) ────────────────────────────────────
async function generateWithOpenRouter(prompt, systemMessage = '', maxTokens = 8192) {
    const models = [
        'openai/gpt-oss-120b:free',
        'openrouter/free',
        'meta-llama/llama-4-maverick:free',
        'google/gemini-2.0-flash-exp:free',
        'deepseek/deepseek-r1:free'
    ];

    for (const model of models) {
        const data = {
            model,
            messages: [
                { role: 'system', content: systemMessage },
                { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' },
            max_tokens: maxTokens,
            temperature: 0.4
        };

        try {
            const response = await axios.post(OPENROUTER_API_URL, data, {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'HTTP-Referer': process.env.APP_URL || 'http://localhost:5173',
                    'X-Title': 'AI Job Assistant'
                },
                timeout: 90000
            });

            const content = response.data?.choices?.[0]?.message?.content;
            if (!content) {
                throw new Error(`Model ${model} returned empty content`);
            }
            console.log(`✓ AI response from ${model}`);
            return content;
        } catch (err) {
            console.error(`OpenRouter [${model}]:`, err.response?.data?.error?.message || err.message);
            if (model === models[models.length - 1]) {
                throw new Error('All OpenRouter models failed. Check API key or try Ollama.');
            }
            console.log(`  → Falling back to next model...`);
            // Small delay before retrying to avoid rate limits
            await new Promise(r => setTimeout(r, 1500));
        }
    }
}

// ─── Ollama Cloud ──────────────────────────────────────────
async function generateWithOllama(prompt, systemMessage = '', maxTokens = 8192) {
    const baseUrl = (process.env.OLLAMA_BASE_URL || 'https://ollama.com/api').replace(/\/api\/?$/, '');
    const apiKey = process.env.OLLAMA_API_KEY || '';
    const models = [
        process.env.DEFAULT_OLLAMA_MODEL || 'qwen3-coder:480b-cloud',
        'gpt-oss:120b-cloud',
        'qwen3-coder:480b-cloud',
        'llama3:70b-cloud'
    ];
    // Remove duplicate of default model
    const uniqueModels = [...new Set(models)];

    for (const model of uniqueModels) {
        try {
            const headers = {};
            if (apiKey) {
                headers['Authorization'] = `Bearer ${apiKey}`;
            }

            const response = await axios.post(`${baseUrl}/api/chat`, {
                model,
                messages: [
                    { role: 'system', content: systemMessage },
                    { role: 'user', content: prompt }
                ],
                stream: false,
                format: 'json'
            }, { headers, timeout: 120000 });

            const content = response.data?.message?.content;
            if (!content) throw new Error(`Ollama ${model} returned empty content`);
            console.log(`✓ AI response from Ollama Cloud (${model})`);
            return content;
        } catch (err) {
            console.error(`Ollama [${model}]:`, err.response?.data?.error || err.message);
            if (model === uniqueModels[uniqueModels.length - 1]) {
                throw new Error('All Ollama Cloud models failed. Check OLLAMA_API_KEY.');
            }
            console.log(`  → Falling back to next Ollama model...`);
            await new Promise(r => setTimeout(r, 1000));
        }
    }
}

// ─── JSON Helpers ──────────────────────────────────────────
function cleanJsonResponse(raw) {
    let cleaned = String(raw).trim();
    // Strip markdown code fences
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    cleaned = cleaned.replace(/\s*```\s*$/i, '');
    return cleaned.trim();
}

/**
 * Attempt to repair common AI JSON mistakes before parsing.
 * Handles: mixed quotes, smart quotes, trailing commas, truncation, etc.
 */
function repairJson(raw) {
    let s = raw.trim();

    // 1. Replace smart/curly quotes with straight quotes
    s = s.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"');
    s = s.replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'");

    // 2. Fix keys that use single quotes: 'key': -> "key":  
    s = s.replace(/'([^']{1,60}?)'\s*:/g, '"$1":');

    // 3. Fix single-quoted string values in arrays: ['val', 'val']
    s = s.replace(/\[\s*'([^']*)'/g, '["$1"');
    s = s.replace(/,\s*'([^']*)'/g, ', "$1"');

    // 4. Fix single-quoted values after colon: : 'value'
    s = s.replace(/:\s*'([^']*)'/g, ': "$1"');

    // 5. Remove trailing commas before } or ]
    s = s.replace(/,\s*([}\]])/g, '$1');

    // 6. Handle truncated JSON — strip incomplete trailing content
    //    Remove any trailing partial key-value or string that was cut off
    s = s.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"{}\[\]]*$/g, '');
    //    Also handle if truncated inside a string value (unclosed quote)
    s = s.replace(/,\s*"[^"]*$/g, '');
    //    Remove dangling comma at end
    s = s.replace(/,\s*$/g, '');

    // 7. Close unclosed brackets/braces
    const openBraces = (s.match(/{/g) || []).length;
    const closeBraces = (s.match(/}/g) || []).length;
    const openBrackets = (s.match(/\[/g) || []).length;
    const closeBrackets = (s.match(/]/g) || []).length;

    for (let i = 0; i < openBrackets - closeBrackets; i++) s += ']';
    for (let i = 0; i < openBraces - closeBraces; i++) s += '}';

    return s;
}

// ─── Exports ───────────────────────────────────────────────
module.exports = {
    /**
     * Generate a structured JSON response from an AI model.
     * Automatically switches between OpenRouter and Ollama based on AI_PROVIDER env.
     */
    async generateJSON(prompt, systemMessage = '', maxTokens = 8192) {
        const provider = (process.env.AI_PROVIDER || 'openrouter').toLowerCase();
        // Prepend master orchestration context, then append the per-call specialist instruction
        const combinedSys = systemMessage
            ? `${MASTER_SYSTEM_PROMPT}\n\n${systemMessage}`
            : MASTER_SYSTEM_PROMPT;
        const sysMsg = combinedSys + '\nIMPORTANT: Your response must be purely a valid JSON object. Do not include markdown code block syntax (like ```json), just the plain raw JSON.';

        const MAX_RETRIES = 3;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            let rawResponse;
            try {
                if (provider === 'ollama') {
                    rawResponse = await generateWithOllama(prompt, sysMsg, maxTokens);
                } else {
                    try {
                        rawResponse = await generateWithOpenRouter(prompt, sysMsg, maxTokens);
                    } catch (openRouterErr) {
                        console.log('OpenRouter models failed. Automatically switching to Ollama Cloud models...');
                        rawResponse = await generateWithOllama(prompt, sysMsg, maxTokens);
                    }
                }

                if (!rawResponse) throw new Error('AI provider returned an empty response.');

                const cleaned = cleanJsonResponse(rawResponse);
                try { return JSON.parse(cleaned); } catch (_) {}

                const repaired = repairJson(cleaned);
                try {
                    console.log('⟳ JSON repair applied successfully');
                    return JSON.parse(repaired);
                } catch (_) {
                    console.warn(`JSON parse failed (attempt ${attempt}/${MAX_RETRIES}). Raw output:\n`, cleaned.slice(0, 400));
                    if (attempt < MAX_RETRIES) {
                        await new Promise(r => setTimeout(r, 2000));
                        continue;
                    }
                    throw new Error('AI returned malformed JSON after 3 attempts. Please try again.');
                }
            } catch (err) {
                if (err.message.includes('malformed JSON') || err.message.includes('empty response')) throw err;
                if (attempt < MAX_RETRIES) {
                    console.warn(`Attempt ${attempt} failed: ${err.message}. Retrying...`);
                    await new Promise(r => setTimeout(r, 2000));
                } else {
                    throw err;
                }
            }
        }
    },

    /**
     * Generate a plain text response (non-JSON).
     * Used for email generation where free-form text is acceptable.
     */
    async generateText(prompt, systemMessage = '') {
        const provider = (process.env.AI_PROVIDER || 'openrouter').toLowerCase();
        // Prepend master orchestration context
        const combinedSys = systemMessage
            ? `${MASTER_SYSTEM_PROMPT}\n\n${systemMessage}`
            : MASTER_SYSTEM_PROMPT;

        if (provider === 'ollama') {
            return await generateWithOllama(prompt, combinedSys);
        } else {
            try {
                return await generateWithOpenRouter(prompt, combinedSys);
            } catch (openRouterErr) {
                console.log('OpenRouter models failed. Automatically switching to Ollama Cloud models...');
                return await generateWithOllama(prompt, combinedSys);
            }
        }
    }
};
