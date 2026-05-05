const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const puppeteer = require('puppeteer');

// ──────────────────────────────────────────────────────────
// HTML → PDF Resume Generator (Puppeteer)
// Replaces the old LaTeX-based pipeline entirely.
// ──────────────────────────────────────────────────────────

const TEMPLATE_DIR = path.join(__dirname, '../templates');
const BUILD_DIR = path.join(__dirname, '../uploads/pdfbuilds');

/**
 * Sanitize user input to prevent script injection.
 * Strips <script> tags and event handlers, but allows normal text.
 * EJS's `<%= %>` handles HTML entity escaping automatically.
 */
function sanitizeString(val) {
    if (val === null || val === undefined) return '';
    return String(val)
        .replace(/<script[\s>]/gi, '')
        .replace(/<\/script>/gi, '')
        .replace(/on\w+\s*=/gi, '');
}

/**
 * Deep-sanitize an object/array: recursively strips dangerous patterns.
 */
function deepSanitize(obj) {
    if (typeof obj === 'string') return sanitizeString(obj);
    if (Array.isArray(obj)) return obj.map(deepSanitize);
    if (obj && typeof obj === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = deepSanitize(value);
        }
        return result;
    }
    return obj;
}

/**
 * Validate the resume JSON structure.
 * Returns an object with { valid, errors }.
 */
function validateResumeData(data) {
    const errors = [];
    
    if (!data || typeof data !== 'object') {
        return { valid: false, errors: ['Resume data must be an object'] };
    }
    if (!data.name || typeof data.name !== 'string') {
        errors.push('Missing or invalid "name" field');
    }
    if (data.experience && !Array.isArray(data.experience)) {
        errors.push('"experience" must be an array');
    }
    if (data.projects && !Array.isArray(data.projects)) {
        errors.push('"projects" must be an array');
    }
    if (data.education && !Array.isArray(data.education)) {
        errors.push('"education" must be an array');
    }
    if (data.certifications && !Array.isArray(data.certifications)) {
        errors.push('"certifications" must be an array');
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Build the links array for the template from resume data fields.
 */
function buildLinks(data) {
    const links = [];
    if (data.github) {
        links.push({
            url: data.github,
            label: data.github.replace('https://', '').replace('http://', '')
        });
    }
    if (data.linkedin) {
        links.push({
            url: data.linkedin,
            label: data.linkedin.replace('https://www.', '').replace('https://', '').replace('http://', '')
        });
    }
    if (data.portfolio) {
        links.push({
            url: data.portfolio,
            label: data.portfolio.replace('https://', '').replace('http://', '')
        });
    }
    return links;
}

/**
 * Render the EJS resume template to an HTML string.
 */
async function renderTemplate(resumeData, templateName = 'resume.ejs') {
    const templatePath = path.join(TEMPLATE_DIR, templateName);

    if (!fs.existsSync(templatePath)) {
        throw new Error(`Resume template not found: ${templatePath}`);
    }

    // Strip dangerous patterns (script tags, event handlers)
    // EJS `<%= %>` handles entity escaping automatically
    const safeData = deepSanitize(resumeData);

    // Build availability label
    const remote = safeData.openToRemote;
    const relocate = safeData.openToRelocate;
    let openTo = '';
    if (remote && relocate) openTo = 'Open to Remote & Relocation';
    else if (remote) openTo = 'Open to Remote';
    else if (relocate) openTo = 'Open to Relocation';

    // Build template locals
    const locals = {
        name: safeData.name || '',
        title: safeData.title || safeData.jobRole || '',
        email: safeData.email || '',
        phone: safeData.phone || '',
        location: safeData.location || '',
        openTo,
        summary: safeData.summary || '',
        skills: safeData.skills || null,
        experience: safeData.experience || [],
        projects: safeData.projects || [],
        education: safeData.education || [],
        certifications: safeData.certifications || [],
        links: buildLinks(safeData),
    };

    const templateStr = fs.readFileSync(templatePath, 'utf-8');
    return ejs.render(templateStr, locals, { filename: templatePath });
}

module.exports = {
    /**
     * Generate a PDF from structured resume JSON data.
     *
     * Flow: JSON → EJS Template → HTML → Puppeteer → PDF
     *
     * @param {Object}  resumeData   Structured resume JSON from AI
     * @param {string}  username     Sanitised username for the filename
     * @param {string}  jobrole      Target job role (slug for filename)
     * @param {string}  company      Target company (slug for filename)
     * @param {string|null} displayJobTitle  Human-readable job title for the PDF header
     * @returns {{ pdfPath: string, filename: string }}
     */
    async generatePdf(resumeData, username, jobrole, company, displayJobTitle = null) {
        // 1. Validate JSON structure
        const { valid, errors } = validateResumeData(resumeData);
        if (!valid) {
            throw new Error(`Invalid resume data: ${errors.join('; ')}`);
        }

        // 2. Set the role title displayed on the PDF
        const data = { ...resumeData };
        data.title = (displayJobTitle || jobrole || 'Software Engineer').toUpperCase();

        // 3. Render HTML from template
        const html = await renderTemplate(data);

        // 4. Ensure output directory exists
        if (!fs.existsSync(BUILD_DIR)) {
            fs.mkdirSync(BUILD_DIR, { recursive: true });
        }

        // 5. Build filename
        const filenameBase = `${username}_${jobrole}_${company}`
            .replace(/[^a-zA-Z0-9]/g, '_')
            .replace(/_+/g, '_');
        const pdfPath = path.join(BUILD_DIR, `${filenameBase}.pdf`);

        // 6. Launch Puppeteer and generate PDF
        let browser = null;
        try {
            browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--font-render-hinting=none'
                ]
            });

            const page = await browser.newPage();
            // Set viewport to exact printable area (US Letter minus 0.5in margins: 720x960 px at 96 DPI)
            await page.setViewport({ width: 720, height: 960 });

            const MAX_ATTEMPTS = 5;
            let currentAttempt = 0;
            let finalHtml = html;
            let currentData = JSON.parse(JSON.stringify(data)); // Deep copy for mutability

            while (currentAttempt < MAX_ATTEMPTS) {
                if (currentAttempt === 1) {
                    // Level 1 Compression: Slight font and gap reduction
                    finalHtml = (await renderTemplate(currentData)) + `<style>html { font-size: 9.5pt !important; } .resume { gap: 0.8rem; }</style>`;
                } else if (currentAttempt === 2) {
                    // Level 2 Compression: Smaller font and trim long experience bullets
                    if (currentData.experience) {
                        currentData.experience.forEach(exp => {
                            if (exp.description && exp.description.length > 3) exp.description.pop();
                        });
                    }
                    finalHtml = (await renderTemplate(currentData)) + `<style>html { font-size: 9pt !important; } .resume { gap: 0.6rem; }</style>`;
                } else if (currentAttempt === 3) {
                    // Level 3 Compression: Trim project bullets and summary
                    if (currentData.projects) {
                        currentData.projects.forEach(proj => {
                            if (proj.description && proj.description.length > 2) proj.description.pop();
                        });
                    }
                    if (currentData.summary && currentData.summary.length > 350) {
                        currentData.summary = currentData.summary.substring(0, 350) + '...';
                    }
                    finalHtml = (await renderTemplate(currentData)) + `<style>html { font-size: 8.5pt !important; } .resume { gap: 0.5rem; } h2.section-title { font-size: 10pt !important; margin-bottom: 2px !important; padding-bottom: 2px !important; }</style>`;
                } else if (currentAttempt === 4) {
                    // Level 4 Compression: Max compression, line-height reduction, trim certifications
                    if (currentData.certifications && currentData.certifications.length > 2) {
                        currentData.certifications = currentData.certifications.slice(0, 2);
                    }
                    finalHtml = (await renderTemplate(currentData)) + `<style>html { font-size: 8pt !important; line-height: 1.1 !important; } .resume { gap: 0.4rem; } h2.section-title { font-size: 9.5pt !important; padding-bottom: 0px !important; margin-top: 2px !important; }</style>`;
                }

                await page.setContent(finalHtml, {
                    waitUntil: 'domcontentloaded',
                    timeout: 30000
                });

                // Measure height of the rendered content
                const contentHeight = await page.evaluate(() => {
                    const resumeElement = document.querySelector('.resume');
                    return resumeElement ? resumeElement.scrollHeight : document.body.scrollHeight;
                });

                // 960px is the maximum height for 10-inch printable area at 96 DPI
                if (contentHeight <= 960) {
                    console.log(`✓ PDF fits on one page (Attempt ${currentAttempt + 1}, height: ${contentHeight}px)`);
                    break;
                } else {
                    console.log(`⚠ PDF overflow detected (Attempt ${currentAttempt + 1}: ${contentHeight}px > 960px). Compressing...`);
                    currentAttempt++;
                }
            }

            await page.pdf({
                path: pdfPath,
                format: 'Letter',
                printBackground: true,
                preferCSSPageSize: false,
                margin: {
                    top: '0.38in',
                    bottom: '0.38in',
                    left: '0.5in',
                    right: '0.5in'
                }
            });

            console.log(`✓ PDF generated and optimized: ${filenameBase}.pdf`);
            return { pdfPath, filename: `${filenameBase}.pdf` };
        } catch (err) {
            console.error('Puppeteer PDF generation error:', err.message);
            throw new Error(`PDF generation failed: ${err.message}`);
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    },

    /**
     * Render resume HTML for preview (no PDF generation).
     * Useful for frontend preview endpoints.
     */
    async renderHtml(resumeData, displayJobTitle = null) {
        const data = { ...resumeData };
        data.title = (displayJobTitle || 'Software Engineer').toUpperCase();
        return renderTemplate(data);
    },

    /**
     * Validate resume data without generating anything.
     */
    validateResumeData
};
