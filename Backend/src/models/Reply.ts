import mongoose, { Types } from "mongoose";

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
    root: {
        type: Types.ObjectId,
        ref: "Post",
        required: true,
        index: true
    },
    likes: [{
        type: Types.ObjectId,
        ref: "Like"
    }],
    disliked: [{
        type: Types.ObjectId,
        ref: "Dislike"
    }]
},
{
    timestamps: true
});

const Reply = mongoose.model("Reply", ReplySchema);
export default Reply;