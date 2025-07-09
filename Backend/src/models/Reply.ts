import mongoose, { mongo, Types } from "mongoose";

const ReplySchema = new mongoose.Schema({
    body: {
        type: String,
        required: true
    },
    replied_by: {
        type: Types.ObjectId,
        ref: "User",
        required: true
    },
    replied_on: {
        type: Types.ObjectId,
        ref: "Comment",
        required: true,
        index: true
    },
    like_count: {
        type: Number,
        default: 0
    },
    dislike_count: {
        type: Number,
        default: 0
    }
},
{
    timestamps: true
});

const Reply = mongoose.model("Reply", ReplySchema);
export default Reply;