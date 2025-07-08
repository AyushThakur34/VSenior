import Post from "../models/Post";
import Comment from "../models/Comment";
import AuthRequest from "src/utils/authRequest";
import { Response } from "express";
import Reply from "src/models/Reply";
import checkBody from "src/utils/checkBody";
import Like from "src/models/Like";
import Dislike from "src/models/Dislike";
import Channel from "src/models/Channel";

export const createComment = async(req: AuthRequest, res: Response):Promise<void> => {
    try {
        const { commented_on, body } = req.body;
        const user = req.user?._id;

        const content = body.trim();
        if(!commented_on || !content) { // handle missing fields
            res.status(400).json({
                success: false, 
                message: "Missing Fields"
            });
            return ;
        }

        const msg = checkBody(content); // checks the content for spam or bad words
        if(msg !== "valid") { // handle the case where content is not valid
            res.status(400).json({
                success: false,
                message: msg
            });
            return ;
        }

        // handle duplicate comments by the same user
        const duplicate = await Comment.findOne({ 
            body: content,
            comment_by: user,
            commented_on,
        });
        if(duplicate) {
            res.status(400).json({
                success: false,
                message: "Comment Already Exists"
            });
            return ;
        }

        const parent = await Post.findById(commented_on).lean();
        if(!parent) { // handle the case for invalid parent
            res.status(400).json({
                success: false,
                message: "Parent Does not exist"
            });
            return ;
        }

        const channel = await Channel.findById(parent.posted_on);
        if(channel?.type === 'college') { // check if channel is restricted
            const Member = channel.members.some(member => member._id.toString() === user);
            if(!Member) {
                res.status(403).json({
                    success: false,
                    message: "You are not authorized to make changes in this channel"
                })
            }
        }

        const comment = await Comment.create({ // create comment if everything is right
            body: content,
            comment_by: user,
            commented_on
        });

        // update the parent by adding the newly created comment
        const updatedParent = await Post.findByIdAndUpdate(commented_on, {$push: {comments: comment._id}}, {new: true}); 
        
        res.status(200).json({
            success: true,
            message: "Comment Added Successfully",
            comment: comment,
            parent: updatedParent
        });

    } catch(err) {
        console.error("[Comment Creation Error]", err);
        res.status(500).json({
            success: false,
            message: "Comment Creation Failed",
            error: err
        });
    }
}

export const editComment = async(req: AuthRequest, res: Response):Promise<void> => {
    try {
        const { body, comment_id } = req.body;
        const user = req.user?._id;

        const content = body.trim();
        if(!content || !comment_id) { // missing field check
            res.status(400).json({
                success: false,
                message: "Missing Fields"
            });
            return ;
        }

        const comment = await Comment.findById(comment_id);
        if(!comment) { // check if such comment exists
            res.status(404).json({
                success: false,
                message: "Comment Not Found"
            });
            return ;
        }
        else if(comment.comment_by?.toString() !== user) { // check if comment is created by the same user if not then the user is not authorized
            res.status(403).json({
                success: false,
                message: "You are not authorized to make changes to this comment"
            });
            return ;
        }

        const msg = checkBody(content); // check content for spam or bad words
        if(msg !== "valid") {
            res.status(400).json({
                success: false,
                message: msg
            });
            return ;
        }

        // if everything is right update the comment
        const updatedComment = await Comment.findByIdAndUpdate(comment_id, {body: content}, {new:true});

        res.status(200).json({
            success: true,
            message: "Comment Updated Successfully",
            comment: updatedComment
        });
    } catch(err) {
        console.error("[Comment Updation Error]:", err);
        res.status(500).json({
            success: false,
            message: "Comment Updation Failed",
            error: err
        });
    }
}

export const deleteComment = async(req: AuthRequest, res: Response):Promise<void> => {
    try {
        const { comment_id } = req.body;
        const user = req.user?._id;

        if(!comment_id) {// missing field check
            res.status(400).json({
                success: false,
                message: "Missing Field"
            });
            return ;
        }

        const comment = await Comment.findById(comment_id).lean();
        if(!comment) { // check for comment existence
            res.status(404).json({
                success: false,
                message: "Comment Not Found"
            });
            return ;
        }

        if(comment.comment_by?.toString()  !== user) { // check if user is the one who created the comment only then the user would be authorized
            res.status(403).json({
                success: false,
                message: "You are not authorized to alter this comment"
            });
            return ;
        }

        // if everything is right we have to delete all the information that is dependent on comment before deleting it
        // info: comment's likes, dislikes and replies
        // but before deleting the replies we have to delete the likes and dislikes
        const parent = comment.commented_on;
        await Post.findByIdAndUpdate(parent, {$pull: {comments: comment_id}});

        const replies = await Reply.find({replied_on: comment_id}).select("_id");
        const replyIDs = replies.map(r => r._id);

        await Like.deleteMany({liked_on: {$in: replyIDs}, on_model: "Reply"});
        await Dislike.deleteMany({disliked_on: {$in: replyIDs}, on_model: "Reply"});
        await Reply.deleteMany({_id: {$in: replyIDs}});

        await Like.deleteMany({liked_on: comment_id, on_model: "Comment"});
        await Dislike.deleteMany({disliked_on: comment_id, on_model: "Comment"});

        await Comment.findByIdAndDelete(comment_id);
        res.status(200).json({
            success: true,
            message: "Comment Deleted Successfully"
        }); 

    } catch(err) {
        console.error("[Comment Deletion Error]: ", err);
        res.status(500).json({
            success: false,
            message: "Comment Deletion Failed",
            error: err
        });
    }
}