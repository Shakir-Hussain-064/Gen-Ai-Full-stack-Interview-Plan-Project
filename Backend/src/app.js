const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');


const app = express();


// ye middleware hai jo ki request body ko json me parse karta hai
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))


/*requires all the routes here */
const authRouter = require('./routes/auth.routes');
const interviewRouter = require('./routes/interview.routes');

/*using all routes here */
app.use('/api/auth', authRouter);
app.use('/api/interview', interviewRouter);


module.exports = app;