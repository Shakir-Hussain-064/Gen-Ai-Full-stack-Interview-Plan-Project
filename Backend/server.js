require("dotenv").config()
const app = require("./src/app")
const connectToDB = require("./src/config/database")


console.log(
    "Gemini API key loaded:",
    Boolean(process.env.GOOGLE_GENAI_API_KEY)
)

connectToDB()

app.listen(3000, ()=>{
    console.log("Server is running on port 3000")
})
