import mongoose, { Types } from "mongoose";

const UserSchema = new mongoose.Schema({
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
        required: true,
        select: false
    },
    college_name: {
        type: String
    },
    college_email: {
        type: String,
        unique: true,
        sparse: true
    },
    post_count: {
        type: Number,
        default: 0
    },
    additional_data: {
        type: Types.ObjectId,
        ref: "AdditionalData"
    },
    private_member: {
        type: Boolean,
        default: false
    }
});

const User = mongoose.model("User", UserSchema);
export default User;