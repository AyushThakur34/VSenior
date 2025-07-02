import mongoose, { Types } from "mongoose";

const LikeSchema = new mongoose.Schema({
    liked_by: {
        type: Types.ObjectId,
        ref: "User",
        required: true
    },
    liked_on: {
        type: Types.ObjectId,
        refPath: "on_model",
        required: true
    },
    on_model: {
        type: String,
        required: true,
        enum: ["Post", "Comment"]
    }
});

const Like = mongoose.model("Like", LikeSchema);
export default Like;