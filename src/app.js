import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser" // Middleware to parse cookies from the user's browser
//use it to access user browser through server to perform crud oprations


const app = express()

// Enable CORS (Cross-Origin Resource Sharing)
// Allows requests from the origin specified in .env (CORS_ORIGIN)
// credentials:true means cookies/auth headers can be sent across origins
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true 
}))

// Parse incoming JSON requests with a size limit of 16kb
app.use(express.json({ limit: "16kb" }))

// Parse URL-encoded data (from forms) with extended syntax and 16kb size limit
app.use(express.urlencoded({ extended: true, limit: "16kb" }))

// Serve static files (e.g., images, CSS, JS) from the "public" folder
app.use(express.static("public"))

// Parse cookies from the request header into req.cookies
app.use(cookieParser())

// Routes Import 
import userRouter from "./routes/user.routes.js";

//  Routes Declaration 
// Mount the user routes at /api/v1/users
app.use("/api/v1/users", userRouter)

export { app }
