const userModel = require('../models/user.model')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const tokenblacklistModel = require('../models/blacklist.model')


/**
 * @name registerUserController
 * @desc register a new user, expects username, email and password in the request body
 * @access Public
 */
async function registerUserController(req, res) {
    const { username, email, password } = req.body

    // it will verify if the username, email and password are provided in the request body or not
    if (!username || !email || !password) {
        return res.status(400).json({
            message: "Please provide username, email and password"
        })
    }

    // it will check if the user already exists with the provided username or email
    const isUserAlreadyExists = await userModel.findOne({
        $or: [
            { username: username },
            { email: email },
        ]
    })

    //  if the user already exists, it will return a 400 status code with a message
    if (isUserAlreadyExists) {
        return res.status(400).json({
            message: "User already exists with this username or email"
        })
    }

    // hash the password using bcryptjs
    const hash = await bcrypt.hash(password, 10)

    // create and persist a new user with the provided username, email and hashed password
    const user = new userModel({
        username,
        email,
        password: hash
    })

    await user.save()

    // save the new user to the database
    const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    )


    // set the token as a cookie
    res.cookie("token", token)


    // save the new user to the database with json response
    res.status(201).json({
        message: "User registered successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
        }
    })
}



/**
 * @name loginUserController
 * @desc login a user, expects email and password in the request body
 * @access Public
 */
async function loginUserController(req, res) {

    // destructure email and password from the request body
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({
            message: "Please provide email and password"
        })
    }

    const user = await userModel.findOne({ email })

    // if the user does not exist, it will return a 400 status code with a message
    if (!user) {
        return res.status(400).json({
            message: "Invalid email or password"
        })
    }

    // compare the provided password with the hashed password stored in the database using bcryptjs
    const ispasswordValid = await bcrypt.compare(password, user.password)

    if (!ispasswordValid) {
        return res.status(400).json({
            message: "Invalid email or password"
        })
    }

    const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    )

    res.cookie("token", token)

    res.status(200).json({
        message: "User loggedIn Successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })
}



/**
 * @name logoutUserController
 * @desc logout a user, expects token in the request header
 * @access Public
 */
async function logoutUserController(req,res){
    const token = req.cookies.token

    if(token){
        await tokenblacklistModel.create({token})

        res.clearCookie("token")

        res.status(200).json({
            message: "User logged out successfully"
        })
    }
}



/**
 * @name getMeController
 * @desc get the details of the current logged in user.
 * @access Private
 */
async function getMeController(req,res){

    const user = await userModel.findById(req.user.id)

    res.status(200).json({
        message: "User details fetched successfully",
        user:{
            id: user._id,
            username: user.username,
            email: user.email
        }
    })
}






module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController
}