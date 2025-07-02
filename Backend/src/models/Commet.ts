import mongoose, { Types } from "mongoose";

const CommentSchema = new mongoose.Schema({
    comment_by: {
        type: Types.ObjectId,
        ref: "User",
        required: true
    },
    commented_on: {
        type: Types.ObjectId,
        refPath: "on_model",
        required: true
    },
    on_model: {
        type: String,
        required: true,
        enum: ["Post", "Comment"]
    },
    likes: [{
        type: Types.ObjectId,
        ref: "Like"
    }],
    dislikes: [{
        type: Types.ObjectId,
        ref: "Dislike"
    }],
    replies: [{
        type: Types.ObjectId,
        ref: "Comment"
    }]
},
{
    timestamps: true
});

const Comment = mongoose.model("Comment", CommentSchema);
export default Comment;