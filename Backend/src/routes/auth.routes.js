const { Router } = require('express')
const authController = require('../controllers/auth.controller')
const authMiddleware = require('../middleware/auth.middleware')

const authRouter = Router()


/**
 * @routes POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
authRouter.post('/register', authController.registerUserController)

/**
 * @routes POST /api/auth/login
 * @description Login a Registered User
 * @access Public
 */
authRouter.post('/login', authController.loginUserController)


/**
 * @routes POST /api/auth/logout
 * @description Logout a Registered User or clear cookies from the browser and add token into blacklist
 * @access Public
 */
authRouter.get('/logout', authController.logoutUserController)
 

/**
 * @routes GET /api/auth/get-me
 * @description Get the details of the logged in user
 * @access Private
 */
authRouter.get('/get-me', authMiddleware.authUser, authController.getMeController)






module.exports = authRouter