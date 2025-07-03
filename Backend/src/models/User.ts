import mongoose, { Types } from "mongoose";

const UserSchema = new mongoose.Schema({
    full_name: {
        type: String,
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    college_name: {
        type: String
    },
    college_email: {
        type: String,
        unique: true,
        sparse: true
    },
    gender: {
        type: String
    },
    handles: {
        linkedin: {
            type: String,
            unique: true,
            sparse: true
        },
        leetcode: {
            type: String,
            unique: true,
            sparse: true
        },
        github: {
            type: String,
            unique: true,
            sparse: true
        }
    },
    followers: [{
        type: Types.ObjectId,
        ref: "User"
    }],
    following: [{
        type: Types.ObjectId,
        ref: "User"
    }]
});

const User = mongoose.model("User", UserSchema);
export default User;