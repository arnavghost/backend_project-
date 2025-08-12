import { asyncHandler } from "../utils/asyncHandler.js"

// Controller function for registering a user
const registerUser = asyncHandler(async (req, res) => {
    res.status(200).json({
        message: "ok"
    })
})

export { registerUser }
