const { PDFParse } = require("pdf-parse")
const mammoth = require("mammoth")
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")




/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {

    let resumeText = ''
    if (req.file?.buffer) {
        const fileBuffer = req.file.buffer
        const originalName = req.file.originalname?.toLowerCase() || ''
        const mimeType = req.file.mimetype || ''

        try {
            if (mimeType === 'application/pdf' || originalName.endsWith('.pdf')) {
                const parser = new PDFParse({ data: fileBuffer })
                const parsedPdf = await parser.getText()
                resumeText = parsedPdf?.text || ''
                if (typeof parser.destroy === 'function') {
                    await parser.destroy()
                }
            } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || originalName.endsWith('.docx')) {
                const parsedDoc = await mammoth.extractRawText({ buffer: fileBuffer })
                resumeText = parsedDoc?.value || ''
            } else {
                resumeText = fileBuffer.toString('utf8')
            }
        } catch (err) {
            console.warn('Resume parsing failed:', err.message)
            resumeText = ''
        }
    }

    const { selfDescription, jobDescription } = req.body

    if (!jobDescription || (!resumeText && !selfDescription)) {
        return res.status(400).json({
            message: 'Job description and at least one of resume or self description are required.'
        })
    }

    const interViewReportByAi = await generateInterviewReport({
        resume: resumeText,
        selfDescription,
        jobDescription
    })

    const savedInterviewReport = await interviewReportModel.create({
        user: req.user.id,
        resume: resumeText,
        selfDescription,
        jobDescription,
        title: interViewReportByAi.title || jobDescription.trim().split('\n')[0].slice(0, 120),
        ...interViewReportByAi
    })

    res.status(201).json({
        message: "Interview report generated successfully.",
        interviewReport: savedInterviewReport
    })

}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    const { interviewReportId } = req.params

    const interviewReport = await interviewReportModel.findById(interviewReportId)

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    const { resume, jobDescription, selfDescription } = interviewReport

    const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
    })

    res.send(pdfBuffer)
}

module.exports = { generateInterViewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController }