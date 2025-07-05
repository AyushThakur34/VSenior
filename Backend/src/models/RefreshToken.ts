import mongoose, { Types } from "mongoose";

const RefreshTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true
    },
    userID: {
        type: Types.ObjectId,
        ref: "User"
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, {timestamps: true});

RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0}); // remove the token from db after expiration  

const RefreshToken = mongoose.model("RefreshToken", RefreshTokenSchema);
export default RefreshToken;