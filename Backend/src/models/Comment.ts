import mongoose, { Types } from "mongoose";

const CommentSchema = new mongoose.Schema({
    body: {
        type: String,
        required: true
    },
    comment_by: {
        type: Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    commented_on: {
        type: Types.ObjectId,
        ref: "Post",
        required: true,
        index: true
    },
    reply_count: {
        type: Number,
        default: 0
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

const Comment = mongoose.model("Comment", CommentSchema);
export default Comment;