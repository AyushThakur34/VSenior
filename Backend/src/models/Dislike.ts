import mongoose, { Types } from "mongoose";

const DislikeSchema = new mongoose.Schema({
    disliked_by: {
        type: Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    disliked_on: {
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

const Dislike = mongoose.model("Dislike", DislikeSchema);
export default Dislike;