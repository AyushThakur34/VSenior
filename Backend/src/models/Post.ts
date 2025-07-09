import mongoose, { Types, Document } from "mongoose";

const PostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    posted_by: {
        type: Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },  
    posted_on: {
        type: Types.ObjectId,
        ref: "Channel",
        required: true,
        index: true
    },
    comment_count: {
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

const Post = mongoose.model("Post", PostSchema);
export default Post;