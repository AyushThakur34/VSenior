import mongoose, { Types } from "mongoose";

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
    likes: [{
        type: Types.ObjectId,
        ref: "Like"
    }],
    dislikes: [{
        type: Types.ObjectId,
        ref: "Dislike"
    }],
    comments: [{
        type: Types.ObjectId,
        ref: "Comment"
    }]
},
{
    timestamps: true
});

const Post = mongoose.model("Post", PostSchema);
export default Post;