const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})

function parseJsonFromText(text) {
    const trimmed = text.trim()
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start === -1 || end === -1) {
        throw new Error('AI response is not valid JSON')
    }
    const jsonString = trimmed.slice(start, end + 1)
    return JSON.parse(jsonString)
}

function normalizeSeverity(value) {
    const normalized = String(value || '').trim().toLowerCase()
    if (['low', 'medium', 'high'].includes(normalized)) return normalized
    if (normalized === 'moderate') return 'medium'
    return 'medium'
}

function normalizeSkillGap(item) {
    const skill = item?.skill || item?.gap || item?.name || item?.skillGap || item?.description || ''
    return {
        skill: String(skill || '').trim(),
        severity: normalizeSeverity(item?.severity || item?.level || item?.importance || 'medium')
    }
}

function normalizePreparationDay(item, index) {
    const rawDay = item?.day ?? item?.dayNumber ?? item?.dayNo ?? item?.dayIndex ?? index + 1
    const day = Number(rawDay)
    const focus = item?.focus || item?.topic || item?.goal || item?.area || item?.description || `Day ${index + 1} preparation`
    const tasks = Array.isArray(item?.tasks)
        ? item.tasks.map((task) => String(task || '').trim()).filter(Boolean)
        : typeof item?.tasks === 'string'
            ? [item.tasks.trim()]
            : item?.task
                ? [String(item.task).trim()]
                : []

    return {
        day: Number.isNaN(day) ? index + 1 : day,
        focus: String(focus || '').trim(),
        tasks: tasks.length ? tasks : [`Work on ${String(focus || 'core interview skills').trim()}`]
    }
}

function normalizeInterviewReport(report) {
    return {
        ...report,
        technicalQuestions: Array.isArray(report?.technicalQuestions)
            ? report.technicalQuestions.map((item) => ({
                question: String(item?.question || item?.prompt || item?.q || '').trim(),
                intention: String(item?.intention || item?.reason || item?.purpose || '').trim(),
                answer: String(item?.answer || item?.response || item?.solution || '').trim()
            }))
            : [],
        behavioralQuestions: Array.isArray(report?.behavioralQuestions)
            ? report.behavioralQuestions.map((item) => ({
                question: String(item?.question || item?.prompt || item?.q || '').trim(),
                intention: String(item?.intention || item?.reason || item?.purpose || '').trim(),
                answer: String(item?.answer || item?.response || item?.solution || '').trim()
            }))
            : [],
        skillGaps: Array.isArray(report?.skillGaps)
            ? report.skillGaps.map(normalizeSkillGap)
            : [],
        preparationPlan: Array.isArray(report?.preparationPlan)
            ? report.preparationPlan.map(normalizePreparationDay)
            : []
    }
}

const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The behavioral question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum([ "low", "medium", "high" ]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().optional().describe("The title of the job for which the interview report is generated"),
})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {

    const prompt = `Generate an interview report as a single valid JSON object with the following fields:
  title: a short job title extracted from the job description
  matchScore: a number between 0 and 100
  technicalQuestions: an array of 3 technical interview questions, each with intention and answer
  behavioralQuestions: an array of 3 behavioral interview questions, each with intention and answer
  skillGaps: an array of 3 skill gaps, each with a severity of low, medium, or high
  preparationPlan: a day-wise preparation plan with at least 4 days of actionable tasks

Candidate details:
Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}

Return only valid JSON exactly as requested. Do not include markdown, explanation, or any extra text.`

    const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
    })

    const jsonResponse = parseJsonFromText(response.text)
    const normalized = normalizeInterviewReport(jsonResponse)
    return interviewReportSchema.parse(normalized)

}



async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4", margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    })

    await browser.close()

    return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
    })

    const jsonContent = parseJsonFromText(response.text)
    const parsedContent = resumePdfSchema.parse(jsonContent)

    const pdfBuffer = await generatePdfFromHtml(parsedContent.html)

    return pdfBuffer

}

module.exports = { generateInterviewReport, generateResumePdf }