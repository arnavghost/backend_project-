import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js" 
import { ApiResponse } from "../utils/ApiResponse.js"


// Controller function for registering a user
const registerUser = asyncHandler(async (req, res) => {
    
    //1- steps to register user
    const {fullname,email,username,password}= req.body
    console.log("email:",email)

    if(
        [fullname,email,username,password].some((field) => field?.trim() == "")
    ) {
        throw new ApiError(400,"all fields are required")
    }

    const existedUser= await User.findOne({
        $or: [{username}, {email}]
    })

    if(existedUser){
        throw new ApiError(409,"user with email or username alreadd exits")
    }

    const avatarLocalPath= req.files?.avatar[0]?.path;
    // const coverImageLocalPath= req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage)
    && req.files.coverImage.length > 0){
    coverImageLocalPath=req.files.coverImage[0].path}

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar file is required")
    }

    const avatar= await uploadOnCloudinary(avatarLocalPath)
    const coverImage= await uploadOnCloudinary(coverImageLocalPath)
    
    if(!avatarLocalPath){
        throw new ApiError(400,"avatar file is required")
    }

    const user= await User.create(
        {
            fullname,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()
        }
    )

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    
    if(!createdUser){
        throw new ApiError(500,"something went wrong while registerig the user ")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser, "user registered successfully")
    )


})

export { registerUser }



//1
//get user details from frontend
    //validation-to check for email is right or wrong and other things and if its not empty
    //check if user already exists: username,emai
    //check for images,check for avatar
    //upload them to cloudinary ,check for avatar is uplaoded in cloudinary 
    //create user object: create entry in db 
    //remove password and refresh token field from reponse
    ///check for user creation 
    // return response

