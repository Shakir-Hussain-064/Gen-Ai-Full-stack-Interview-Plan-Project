const jwt = require('jsonwebtoken')
const tokenblacklistModel = require('../models/blacklist.model')

async function authUser(req, res, next) {

    const token = req.cookies.token

    if(!token){
        return res.status(401).json({
            message: "Unauthorized, please login to access this resource"
        })
    }

    const isTokenBlacklisted = await tokenblacklistModel.findOne({token})

    if(isTokenBlacklisted){
        return res.status(401).json({
            message: "Token is Invalid"
        })
    }


    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        req.user = decoded

        next()

    }catch(err){
        return res.status(401).json({
            message: "Invalid Token"
        })
    }
}



module.exports = {authUser}