import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"; //its a bearer token - whoever has the token we will send it to them 
import bcrypt from "bcrypt" // used for hashing passwords

const userSchema= new Schema(
    {
        username:{
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true // to enable seraching field its better to use index:true(can be done without this also it just makes it optimized)
        },
        email:{
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        fullname:{
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar:{
            type: String, // cloudinary url-gives url when u uplaod it just like aws or cloud srvices
            required: true
        },
        coverImage:{
            type: String,
        },
        watchHistory:[
            {
                type:Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password:{
            type: String,
            required: [true,'password is required']
        },
        refreshToken:{
            type: String
        }

    },
    {
        timestamps: true
    }
)

userSchema.pre("save", async function(next) {      //have used pre(middleware) hook to hash the password before saving it // async function is used when it takes time to fetch the data and all 
    if(!this.isModified("password")) return next();

    this.password= await bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect= async function  // to comapre the password when the user logins
 (password){
    return await bcrypt.compare(password, this.password)
 }

 userSchema.methods.generateAccessToken= function() {
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullname:this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
 }
 userSchema.methods.generateRefreshToken= function() {
    return jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
 }

export const User=mongoose.model("User", userSchema)

//usermodel