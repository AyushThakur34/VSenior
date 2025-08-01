import mongoose, { Types } from "mongoose";

const LikeSchema = new mongoose.Schema({
    liked_by: {
        type: Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    liked_on: {
        type: Types.ObjectId,
        refPath: "on_model",
        required: true,
        index: true
    },
    on_model: {
        type: String,
        required: true,
        enum: ["Post", "Comment", "Reply"]
    }
});

const Like = mongoose.model("Like", LikeSchema);
export default Like;