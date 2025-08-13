//require('dotenv').config({ path: './env' })
import dotenv from "dotenv"
import connectDb from "./db/index.js";
import { app } from "./app.js";



dotenv.config({
    path: './.env'
})


connectDb()
.then(() => {
    const server = app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running at port: ${process.env.PORT || 8000}`);
    });

    server.on("error", (error) => {
        console.error("SERVER ERROR:", error.message);
        throw error; // optional: exit process instead of throwing
    });
})
.catch((err) => {
    console.log("MongoDB connection failed!!!", err);
});















// import mongoose from "mongoose";
// import {DB_NAME} from "./constants"
// import express from "express"

// ( async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("errror", (error) => {
//             console.log("ERRR: ", error);
//             throw error
//         })

//         app.listen(process.env.PORT, () => {
//             console.log(`App is listening on port ${process.env.PORT}`);
//         })

//     } catch (error) {
//         console.error("ERROR: ", error)
//         throw err
//     }
// })()