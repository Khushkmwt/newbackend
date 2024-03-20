// require('dotenv').config({path:"./db/index.js"});
import dotenv from "dotenv"
import connectDB from "./db/index.js"
import { app } from "./app.js"

dotenv.config({
    path:"./env"
})

const port = process.env.PORT || 8000

connectDB()
.then(res =>{

    // app.on( error => {
    //     console.log("error:",error);
    //     throw error
    // })
    app.listen(port, () => {
        console.log(`server is connected at port ${port}`)
    })
})
.catch(err => {
    console.log("error:",err)
})





















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
