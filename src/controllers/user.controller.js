import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js" 
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

//these two methods we have created of tokens
//access token we send it to the user,but refresh token we keep it in the database so that theres no need to ask the password again 
const generateAccessAndRefreshToken= async(userId) => {
    try {
        const user= await User.findById(userId)
        const accessToken= user.generateAccessToken()
        const refreshToken= user.generateRefreshToken()

        //saving refresh token in database
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})//dont add any validation just save it 

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500,"something went wrong while generating refresh and access token ")
    }
}

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

const loginUser= asyncHandler(async(req,res) => {
    //2
    const {email,username,password}= req.body

    if(!username || !password){
        throw new ApiError(400,"username or password is required")
    }

    const user= await User.findOne({
        $or: [{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"user does not exist")
    }

    const isPasswordValid= await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"password invalid")
    }

    const {accessToken,refreshToken}= await generateAccessAndRefreshToken(user._id)

    const loggedInUser= await User.findById(user._id).
    select("-password -refreshToken")

    //sending cookies
    const options={    //to not allow to modify cookies from frontend we make both true so that it is modified through server
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken,options)// {key,value}
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,accessToken,refreshToken //we have already sent this in cookie we are just sending it here just in case if the user wants save it locally(not a good practice)
            },
            "user logged in successfully"
        )
    )

})

const logoutUser= asyncHandler(async(req,res,next) => {
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
            {
                new: true
            }
        
    )

    const options={    //to not allow to modify cookies from frontend we make both true so that it is modified through server
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200, {}, "user logged out"))

})

const refreshAccessToken= asyncHandler(async(req,res) =>{
    try {
        const incomingRefreshToken= req.cookies.refreshToken || req.body.refreshToken //accessing thorught mobile the seconf=d one

    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request")
    }

    const decodedToken= jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)

    const user= await User.findById(decodedToken?._id)

    if(!user){
        throw new ApiError(401,"invalid refresh token")
    }

    if(incomingRefreshToken!== user?.refreshToken){
        throw new ApiError(401,"reftresh is expired or used")
    }

    const options={
        httpOnly: true,
        secure: true
    }

    const {accessToken,newrefreshToken}= await generateAccessAndRefreshToken(user._id)

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newrefreshToken,options)
    .json(
        new ApiResponse(
            200,
            {accessToken,refreshToken: newrefreshToken},
            "access token refreshed"
        )
    )
    } catch (error) {
        throw new ApiError(400,error?.message || "invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword} = req.body;

    const user= await User.findById(req.user?._idid)
    const isPasswordCorrect= await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(401,"old password is incorrect")
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "password changed successfully")
    )
} )

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(200,req.user, "current user fetched successfully")
})

const updateAccountDetails= asyncHandler(async (req, res) => {
    const {fullname, email} = req.body;
    if(!fullname || !email) {
        throw new ApiError(400, "fullname and email are required");
    }

    User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email: email
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "user details updated successfully")
    )
})

const updateUserAvatar= asyncHandler(async(req,res) => {
    const avatarLocalPath= req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400,"avatar file is missing")
    }

    const avatar= await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"error while uploading on avatar")
    }
    const user= await User.findByIdAndUpdate(
            req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"avatar image updated successfully")
    )
})

const updateUserCoverImage= asyncHandler(async(req,res) => {
    const coverImageLocalPath= req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400," cover image file  is missing")
    }

    const coverImage= await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400,"error while uploading on avatar")
    }
    const user= await User.findByIdAndUpdate(
            req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"cover image updated successfully")
    )
})

export { 
    registerUser,
    loginUser, 
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    changeCurrentPassword,
    getCurrentUser,
    updateUserAvatar,
    updateUserCoverImage
}















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

//2
// req body -> data 
// username or email is present or no 
// find the user 
// if user is present check password 
// if password is right generate access and refresh token
// send the tokens in the form of cookies 