import Post from "../models/Post";
import Channel from "../models/Channel";
import Comment from "../models/Comment";
import Like from "../models/Like";
import Dislike from "../models/Dislike";
import { Response } from "express";
import AuthRequest from "../utils/authRequest";
import Reply from "src/models/Reply";
import checkBody from "src/utils/checkBody";

export const createPost = async(req: AuthRequest, res: Response): Promise<void>=> {
    try {
        const { heading, content, channelID} = req.body;
        const userID = req.user?._id;

        const title = heading.trim();
        const body = content.trim();
        if(!title || !body) {
            res.status(400).json({
                success: false,
                message: "Title, Body and UserID required"
            });
            return ;
        }

        const msg1 = checkBody(title);
        const msg2 = checkBody(body);
        if(msg1 !== "valid" || msg2 !== "valid") {
            res.status(400).json({
                success: false,
                message: `Title: ${msg1}, Body: ${msg2}`
            });
            return ;
        }

        const newPost = await Post.create({title, body, posted_by: userID});
        await Channel.findByIdAndUpdate(channelID, {$push: {posts: newPost._id}});

        res.status(200).json({
            success: true,
            message: "Post Created Successfully",
            post: newPost
        });

    } catch(err) {
        console.error("[Post Creation Error]:", err);
        res.status(500).json({
            success: false,
            message: "Post Creation Failed",
            error: err
        });
    }
}

export const editPost = async(req: AuthRequest, res: Response):Promise<void>=> {
    try {
        const { postID, heading, content } = req.body;
        const userID = req.user?._id;

        const title = heading.trim();
        const body = content.trim();
        if(!postID || !title || !body) {
            res.status(400).json({
                success: false,
                message: "Title, Body and UserID required"
            });
            return ;
        }

        const msg1 = checkBody(title);
        const msg2 = checkBody(body);
        if(msg1 !== "valid" || msg2 !== "valid") {
            res.status(400).json({
                success: false,
                message: `Title: ${msg1}, Body: ${msg2}`
            });
            return ;
        }

        const post = await Post.findById(postID);
        const postedBy = post?.posted_by;
        if(!post || postedBy?.toString() !== userID) {
            res.status(403).json({
                success: false,
                message: "You are not allowed to alter this post"
            });
            return ;
        }

        const oldTitle = post.title;
        const oldBody = post.body;
        if(oldTitle == title &&  oldBody == body) { // no need to retreive data if fields are unchanged
            res.status(400).json({
                success: false,
                message: "Title and Body both are unchanged"
            });
            return ;
        }

        const updatedPost = await Post.findByIdAndUpdate(postID, {title, body}, {new: true  });
        res.status(200).json({
            success: true,
            message: "Post Updated Successfully",
            post: updatedPost
        });

    } catch(err) {
        console.error("[Post Editing Error]", err);
        res.status(500).json({
            success: false,
            message: "Post Editing Failed",
            error: err
        }); 
    }
}

export const deletePost = async(req: AuthRequest, res: Response):Promise<void>=> {
    try {
        const { postID, channelID } = req.body;
        const userID = req.user?._id;

        if(!postID || !channelID) {
            res.status(400).json({
                success: false,
                message: "Missing PostID or ChannelID"
            });
            return ;
        }

        const post = await Post.findById(postID);
        const postedBy = post?.posted_by; // post can only be deleted by the user who posted it
        if(!post || postedBy?.toString() !== userID) {
            res.status(403).json({
                success: false,
                message: "You are not authorized to delete this post"
            });
            return ;
        }

        const channel = await Channel.findByIdAndUpdate(channelID, {$pull: {posts: postID}}); // delete from channel
        if(!channel) {
            res.status(400).json({
                success: false,
                message: "Post Does Not exist in the Channel"
            });
            return ;
        }

        await Comment.deleteMany({commented_on: postID}); // delete all related comments
        await Reply.deleteMany({root: postID}); // delete all related replies
        await Like.deleteMany({liked_on: postID}); // delete all related likes 
        await Dislike.deleteMany({disliked_on: postID}); // delete all related dislikes

        await Post.findByIdAndDelete(postID); // delete post

        res.status(200).json({
            success: true,
            message: "Post Deleted Successfully"
        });

    } catch(err) {
        console.error("[Post Deletion Error]", err);
        res.status(500).json({
            success: false,
            message: "Post Deletion Failed",
            error: err
        }); 
    }
}