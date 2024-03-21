import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudynary.js"
import {ApiResponse} from "../utils/apiResponse.js"
import { response } from "express"

const generateAccessAndRefreshToken = async (userId) =>{
   try {
    const user =await User.findById(userId)
    const accessToken =  user.generateAccessToken()
    const refreshToken = user.generateRefreshToken() 
    user.refreshToken = refreshToken
   await user.save({validateBeforeSave:false})
   return {accessToken,refreshToken}

   } catch (error) {
      throw new ApiError(500,"something went wrong during access refresh token ")
   }
}

const registerUser = asyncHandler(async (req,res) =>{
   
    const {fullname="",email="",username="",password=""} = req.body
    console.log(email);
    //username ,password , email,fullname //
    if(
        [fullname,email,username,password].some((field) => field?.trim()==="")
    ){
        throw new ApiError(400,"all fields are required")
    
    }

    // should not already registered//
   const existedUser= await User.findOne({
          $or:[{username},{email}]
     })
     if(existedUser){
        throw new ApiError(409,"user with email or username already exist")
     }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath;
    //get avatar//
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0){
        coverImageLocalPath = req.files?.coverImage[0]?.path;
    }
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar not uploaded")
    }
//uploaded on cloudinary or not//
   const avatar= await uploadOnCloudinary(avatarLocalPath)
   const coverImage= await uploadOnCloudinary(coverImageLocalPath)
   
   if(!avatar){
    throw new ApiError(400,"Avatar not uploaded")
   }

   //create object in db//

   const user =  await  User.create({
    fullname,
    avatar:avatar.url,
    coverImage:coverImage?.url || " ",
    email,
    password,
    username:username.toLowerCase()
   })

   // check user created or not//
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

   if(!createdUser){
    throw new ApiError(500,"something when wrong during registeration")
   }

//return response//
return res.status(201).json(
    new ApiResponse(200,createdUser,"user registered successfully")
)


})

const loginUser = asyncHandler(async (req,res) =>{
    //get data from req.body //
 const {username ,email,password} = await req.body;
 console.log(username,password,email)
 //check email or password got or not//
 if(!username && !email){
    throw new ApiError(400,"email or username required")
 }

 //find the user
 const user =   await User.findOne({
    $or:[{email},{username}]
 })
 if(!user){
    throw new ApiError(400,"user not registered")
 }

 //check password true or not//
 
 const isPasswordValid = await user.isPasswordCorrect(password)

 if (!isPasswordValid) {
  throw new ApiError(401, "Invalid user credentials")
  }
//genrate access and refresh token//
  const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)

//remove password and refreshtoken -- secuiriy//

 const loggedinUser = await User.findById(user._id).select("-password -refreshToken")

//send cookies//

const options ={
    httpOnly:true,
    secure:true
}

return res.status(200)
       .cookie("accessToken",accessToken,options)
       .cookie("refreshToken",refreshToken,options)
       .json(
        new ApiResponse(200,{user:accessToken,refreshToken,loggedinUser},"user logged in successfully")
       )

})


const logoutUser = asyncHandler(async(req, res) => {
   await User.findByIdAndUpdate(
       req.user._id,
       {
           $unset: {
               refreshToken: 1 // this removes the field from document
           }
       },
       {
           new: true
       }
   )

   const options = {
       httpOnly: true,
       secure: true
   }

   return res
   .status(200)
   .clearCookie("accessToken", options)
   .clearCookie("refreshToken", options)
   .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

   if (!incomingRefreshToken) {
       throw new ApiError(401, "unauthorized request")
   }

   try {
       const decodedToken = jwt.verify(
           incomingRefreshToken,
           process.env.REFRESH_TOKEN_SECRET
       )
   
       const user = await User.findById(decodedToken?._id)
   
       if (!user) {
           throw new ApiError(401, "Invalid refresh token")
       }
   
       if (incomingRefreshToken !== user?.refreshToken) {
           throw new ApiError(401, "Refresh token is expired or used")
           
       }
   
       const options = {
           httpOnly: true,
           secure: true
       }
   
       const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
   
       return res
       .status(200)
       .cookie("accessToken", accessToken, options)
       .cookie("refreshToken", newRefreshToken, options)
       .json(
           new ApiResponse(
               200, 
               {accessToken, refreshToken: newRefreshToken},
               "Access token refreshed"
           )
       )
   } catch (error) {
       throw new ApiError(401, error?.message || "Invalid refresh token")
   }

})


export {registerUser,loginUser,logoutUser, refreshAccessToken} ;