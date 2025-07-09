import Post from "../models/Post.ts";
import Channel from "../models/Channel.ts";
import Comment from "../models/Comment.ts";
import Like from "../models/Like.ts";
import Dislike from "../models/Dislike.ts";
import { Response } from "express";
import AuthRequest from "../utils/authRequest.ts";
import Reply from "../models/Reply.ts";
import checkBody from "../utils/checkBody.ts";
import dotenv from "dotenv";
dotenv.config();

export const createPost = async(req: AuthRequest, res: Response): Promise<void>=> {
    try {
        const { channel_id } = req.body;
        const title = req.body.title?.trim();
        const body = req.body.body?.trim();
        const userID = req.user?._id;
        const member = req.user?.private_member;

        if(!title || !body || !channel_id) { // handle missing fields
            res.status(400).json({
                success: false,
                message: "Title, Body and UserID required"
            });
            return ;
        }

        const channel = await Channel.findById(channel_id).lean();
        if(!channel) { // check for channel existance
            res.status(400).json({
                success: false,
                message: "Channel Does Not Exist"
            });
            return ;
        }
        else if(channel.type === "college" && !member) { // handle the case if post is for private channel
            res.status(403).json({
                success: false,
                message: "You are not authorized to make posts in this channel"
            });
            return;
        }
        
        const msg1 = checkBody(title);
        const msg2 = checkBody(body);
        if(msg1 !== "valid" || msg2 !== "valid") { // validate title and body for spam or bad words
            res.status(400).json({
                success: false,
                message: `Title: ${msg1}, Body: ${msg2}`
            });
            return ;
        }   

        // if everything is passed create t he post and add into respective channel
        const newPost = await Post.create({title, body, posted_by: userID, posted_on: channel._id}); 
        await Channel.findByIdAndUpdate(channel_id, {$inc: {post_count: +1}}, {new: true}).lean();

        res.status(200).json({
            success: true,
            message: "Post Created Successfully",
            post: newPost,
            post_count: channel.post_count + 1
        });

    } catch(err) {
        if (process.env.NODE_ENV !== "production") console.error("[Post Creation Error]:", err);
        res.status(500).json({
            success: false,
            message: "Post Creation Failed",
        });
    }
}

export const editPost = async(req: AuthRequest, res: Response):Promise<void>=> {
    try {
        const post_id = req.body.post_id;
        const userID = req.user?._id;
        const title = req.body.title?.trim();
        const body = req.body.body?.trim();

        if(!post_id || !title || !body) { // check for missing fields
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

        const updatedPost = await Post.findOneAndUpdate({_id: post_id, posted_by: userID}, {title, body}, {new: true}).lean();
        if(!updatedPost) {
            res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
            return ;
        }

        res.status(200).json({
            success: true,
            message: "Post Updated Successfully",
            post: updatedPost
        });

    } catch(err) {
        if (process.env.NODE_ENV !== "production") console.error("[Post Updation Error]", err);
        res.status(500).json({
            success: false,
            message: "Post Updation Failed",
        }); 
    }
}

export const deletePost = async(req: AuthRequest, res: Response):Promise<void>=> {
    try {
        const { post_id } = req.body;
        const userID = req.user?._id;

        if(!post_id) { // check for missing field
            res.status(400).json({
                success: false,
                message: "post_id Required"
            });
            return ;
        }

        const post = await Post.findOne({_id: post_id, posted_by: userID}).lean();
        if(!post) {
            res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
            return ;
        }

        const channel_id = post.posted_on;

        // before deleting post itself delete all the data in the db dependent on it
        // delete all the comments and likes/disliked on them but before that 
        // delete all the replies on those comments and likes/dislikes on them then
        // update post count in channel
        const comments = await Comment.find({commented_on: post._id}).select("_id").lean();
        const commentIDs = comments.map(c => c._id);

        const replies = await Reply.find({replied_on: {$in: commentIDs}}).select("_id").lean();
        const replyIDs = replies.map(r => r._id);

        const bulkIDs = [...replyIDs, ...commentIDs, post_id];
        await Promise.all([
            Like.deleteMany({liked_on: {$in: bulkIDs}}),
            Dislike.deleteMany({disliked_on: {$in: bulkIDs}}),
            Reply.deleteMany({replied_on: {$in: commentIDs}}),
            Comment.deleteMany({commented_on: post._id}),
            Post.findByIdAndDelete(post_id),
        ]);

        const channel = await Channel.findByIdAndUpdate(channel_id, {$inc: {post_count: -1}}, {new: true}).lean();

        res.status(200).json({
            success: true,
            message: "Post Deleted Successfully",
            post_count: channel?.post_count
        });

    } catch(err) {
        if (process.env.NODE_ENV !== "production") console.error("[Post Deletion Error]", err);
        res.status(500).json({
            success: false,
            message: "Post Deletion Failed",
        }); 
    }
}