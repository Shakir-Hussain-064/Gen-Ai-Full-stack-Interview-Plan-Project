const express = require("express")
const authMiddleware = require("../middleware/auth.middleware")
const interviewController = require("../controllers/interview.controller")
const upload = require("../middleware/file.middleware")

const interviewRouter = express.Router()


/**
 * @route POST /api/interview 
 * @description Generate an interview report based on the self description, resume and job description provided by the user.
 * @access private
 */
interviewRouter.post("/", authMiddleware.authUser, upload.single("resume"), interviewController.generateInterViewReportController)


/**
 * @route GET /api/interview/report/:interviewId
 * @description Retrieve an interview report by its ID.
 * @access private
 */
interviewRouter.get("/report/:interviewId", authMiddleware.authUser, interviewController.getInterviewReportByIdController)



/**
 * @route GET /api/interview
 * @description Retrieve all interview reports for the authenticated user.
 * @access private
 */
interviewRouter.get("/", authMiddleware.authUser, interviewController.getAllInterviewReportsController)
 



/**
 * @route GET /api/interview/resume/pdf
 * @description generate resume pdf on the basis of user self description, resume content and job description.
 * @access private
 */
interviewRouter.post("/resume/pdf/:interviewReportId", authMiddleware.authUser, interviewController.generateResumePdfController)





module.exports = interviewRouter