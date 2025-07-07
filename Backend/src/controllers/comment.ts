import Post from "../models/Post";
import Comment from "../models/Comment";
import AuthRequest from "src/utils/authRequest";
import { Response } from "express";
import Reply from "src/models/Reply";
import checkBody from "src/utils/checkBody";

export const createComment = async(req: AuthRequest, res: Response):Promise<void> => {
    try {
        const { commented_on, content } = req.body;
        const user = req.user?._id;

        const body = content.trim();
        if(!commented_on || !body) { // handle missing fields
            res.status(400).json({
                success: false, 
                message: "Missing Fields"
            });
            return ;
        }

        const msg = checkBody(body);
        if(msg !== "valid") {
            res.status(400).json({
                success: false,
                message: msg
            });
            return ;
        }

        const duplicate = await Comment.findOne({ // handle duplicate commentes by the same user
            body,
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
        if(!parent) {
            res.status(400).json({
                success: false,
                message: "Parent Does not exist"
            });
            return ;
        }

        const comment = await Comment.create({
            body,
            comment_by: user,
            commented_on
        });

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
        const { content, comment_id } = req.body;
        const user = req.user?._id;

        const body = content.trim();
        if(!body || !comment_id) { // missing field check
            res.status(400).json({
                success: false,
                message: "Missing Fields"
            });
            return ;
        }

        const comment = await Comment.findById(comment_id);
        if(!comment) {
            res.status(404).json({
                success: false,
                message: "Comment Not Found"
            });
            return ;
        }
        if(comment.comment_by?.toString()  !== user) {
            res.status(403).json({
                success: false,
                message: "You are not authorized to make changes to this comment"
            });
            return ;
        }

        const msg = checkBody(body);
        if(msg !== "valid") {
            res.status(400).json({
                success: false,
                message: msg
            });
            return ;
        }

        const updatedComment = await Comment.findByIdAndUpdate(comment_id, {body}, {new:true});

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

        if(!comment_id) {
            res.status(400).json({
                success: false,
                message: "Missing Field"
            });
            return ;
        }

        const comment = await Comment.findById(comment_id).lean();
        if(!comment) {
            res.status(404).json({
                success: false,
                message: "Comment Not Found"
            });
            return ;
        }

        if(comment.comment_by?.toString()  !== user) {
            res.status(403).json({
                success: false,
                message: "You are not authorized to alter this comment"
            });
            return ;
        }

        const parent = comment.commented_on;
        await Post.findByIdAndUpdate(parent, {$pull: {comments: comment_id}});
        await Reply.deleteMany({replied_on: comment_id});

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