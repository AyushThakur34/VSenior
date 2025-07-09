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
        const { commented_on } = req.body;
        const body = req.body.body.trim();
        const userID = req.user?._id;
        const member = req.user?.private_member;

        if(!commented_on || !body) { // handle missing fields
            res.status(400).json({
                success: false, 
                message: "Missing Fields"
            });
            return ;
        }

        const msg = checkBody(body); // checks the content for spam or bad words
        if(msg !== "valid") { // handle the case where content is not valid
            res.status(400).json({
                success: false,
                message: msg
            });
            return ;
        }

        // handle duplicate comments by the same user
        const duplicate = await Comment.findOne({ 
            body,
            comment_by: userID,
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
                message: "Parent Does Not Exist"
            });
            return ;
        }

        const channel = await Channel.findById(parent.posted_on).lean();
        if(!channel || channel.type === "college" && !member) {
            res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
            return ;
        }

        const comment = await Comment.create({ // create comment if everything is right
            body,
            comment_by: userID,
            commented_on
        });

        // update the parent by adding the newly created comment
        const updatedParent = await Post.findByIdAndUpdate(commented_on, {$inc: {comment_count: +1}}, {new: true}); 
        
        res.status(200).json({
            success: true,
            message: "Comment Added Successfully",
            comment: comment,
            comment_count: updatedParent?.comment_count
        });

    } catch(err) {
        if (process.env.NODE_ENV !== "production") console.error("[Comment Creation Error]", err);
        res.status(500).json({
            success: false,
            message: "Comment Creation Failed",
        });
    }
}

export const editComment = async(req: AuthRequest, res: Response):Promise<void> => {
    try {
        const { comment_id } = req.body;
        const body = req.body.body.trim();
        const userID = req.user?._id;

        if(!body || !comment_id) { // missing field check
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
        else if(comment.comment_by?.toString() !== userID) { // check if comment is created by the same user if not then the user is not authorized
            res.status(403).json({
                success: false,
                message: "You are not authorized to make changes to this comment"
            });
            return ;
        }
        else if(comment.body === body) {
            res.status(400).json({
                success: false,
                message: "Body Unchanged"
            });
            return ;
        }

        const msg = checkBody(body); // check content for spam or bad words
        if(msg !== "valid") {
            res.status(400).json({
                success: false,
                message: msg
            });
            return ;
        }

        // if everything is right update the comment
        const updatedComment = await Comment.findByIdAndUpdate(comment_id, {body}, {new:true});

        res.status(200).json({
            success: true,
            message: "Comment Updated Successfully",
            comment: updatedComment
        });
    } catch(err) {
        if (process.env.NODE_ENV !== "production") console.error("[Comment Updation Error]:", err);
        res.status(500).json({
            success: false,
            message: "Comment Updation Failed",
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
        
        const replies = await Reply.find({replied_on: comment._id}).select("_id");
        const replyIDs = replies.map( r => r._id );

        const bulkIDs = [...replyIDs, comment._id];

        await Promise.all([
            Like.deleteMany({liked_on: {$in: bulkIDs}}),
            Dislike.deleteMany({disliked_on: bulkIDs}),
            Reply.deleteMany({$in: {replyIDs}}),
            Comment.findOneAndDelete(comment._id),
        ]);

        const post = await Post.findByIdAndUpdate(comment.commented_on, {$inc: {comment_count: -1}}, {new: true}).lean();

        res.status(200).json({
            success: true,
            message: "Comment Deleted Successfully",
            comment_count: post?.comment_count
        }); 

    } catch(err) {
        if (process.env.NODE_ENV !== "production") console.error("[Comment Deletion Error]: ", err);
        res.status(500).json({
            success: false,
            message: "Comment Deletion Failed",
        });
    }
}