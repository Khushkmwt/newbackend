import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudynary.js"
import {ApiResponse} from "../utils/apiResponse.js"
import { response } from "express"

const registerUser = asyncHandler(async (req,res) =>{
   
    const {fullname,email,username,password} = req.body
    console.log(email);
    //username ,password , email,fullname //
    if(
        [fullname,email,username,password].some((field) => field?.trim()==="")
    ){
        throw new ApiError(400,"all fields are required")
    
    }

    // should not already registered//
   const existedUser= User.findOne({
          $or:[{username},{email}]
     })
     if(existedUser){
        throw new ApiError(409,"user with email or username already exist")
     }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    //get avatar//
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


export default registerUser;