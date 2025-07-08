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
        const { title, body, channelID } = req.body;
        const userID = req.user?._id;

        const heading = title.trim();
        const content = body.trim();
        if(!heading || !content || !channelID) { // handle missing fields
            res.status(400).json({
                success: false,
                message: "Title, Body and UserID required"
            });
            return ;
        }

        const channel = await Channel.findById(channelID);
        if(!channel) { // check for channel existence
            res.status(400).json({
                success: false,
                message: "Channel does not exist"
            });
            return ;
        }

        if(channel.type === "college") { // check if the user is member of this channel
            const Member = channel.members.some(member => member.toString() === userID);
            if(!Member) {
                res.status(403).json({
                    success: false,
                    message: "You are not a member of this college channel"
                });
                return ;
            }
        }

        const msg1 = checkBody(heading);
        const msg2 = checkBody(content);
        if(msg1 !== "valid" || msg2 !== "valid") { // validate title and body for spam or bad words
            res.status(400).json({
                success: false,
                message: `Title: ${msg1}, Body: ${msg2}`
            });
            return ;
        }   

        // if everything is passed create the post and add into respective channel
        const newPost = await Post.create({title: heading, body: content, posted_by: userID, posted_on: channel._id}); 
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
        const { postID, title, body } = req.body;
        const userID = req.user?._id;

        const heading = title.trim();
        const content = body.trim();
        if(!postID || !heading || !content) { // check for missing fields
            res.status(400).json({
                success: false,
                message: "Title, Body and UserID required"
            });
            return ;
        }

        const msg1 = checkBody(heading);
        const msg2 = checkBody(content);
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
        if(oldTitle == heading && oldBody == content) { // no need to retreive data if fields are unchanged
            res.status(400).json({
                success: false,
                message: "Title and Body both are unchanged"
            });
            return ;
        }

        const updatedPost = await Post.findByIdAndUpdate(postID, {title: heading, body: content}, {new: true});
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

        const comments = await Comment.find({commented_on: postID}).select("_id");
        const commentIDs = comments.map(c => c._id);

        const replies = await Reply.find({replied_on: {$in: commentIDs}}).select("_id");
        const replyIDs = replies.map(r => r._id);

        // delete all likes and dislikes on comments
        await Like.deleteMany({liked_on: {$in: commentIDs}, on_model: "Comment"});
        await Dislike.deleteMany({disliked_on: {$in: commentIDs}, on_model: "Comment"});

        // delete all likes and dislikes on replies
        await Like.deleteMany({liked_on: {$in: replyIDs}, on_model: "Reply"});
        await Dislike.deleteMany({disliked_on: {$in: replyIDs}, on_model: "Reply"});

        // delete replies
        await Reply.deleteMany({ _id: { $in: replyIDs } });

        // delete comments
        await Comment.deleteMany({ _id: { $in: commentIDs } });

        // delete likes/dislikes on the post itself
        await Like.deleteMany({liked_on: postID, on_model: "Post"});
        await Dislike.deleteMany({disliked_on: postID, on_model: "Post"});

        // delete post itself
        await Post.findByIdAndDelete(postID);

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