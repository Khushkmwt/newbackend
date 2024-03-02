// require('dotenv').config({path:"./db/index.js"});
import dotenv from "dotenv"
import connectDB from "./db/index.js"

dotenv.config({
    path:"./env"
})



connectDB()





















/*

( async () =>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error) =>{
            console.log("errr:",error)
            throw error
        });
        app.listen(process.env.PORT,() => {
            console.log(`app is listening at port ${process.env.PORT}`)
        })
    } catch (error) {
        console.log("errr:",error)
        throw error

    }
})() */
