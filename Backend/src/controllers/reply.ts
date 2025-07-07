import Comment from "../models/Comment";
import AuthRequest from "src/utils/authRequest";
import { Response } from "express";
import Reply from "src/models/Reply";
import checkBody from "src/utils/checkBody";
import Like from "src/models/Like";
import Dislike from "src/models/Dislike";

export const createReply = async(req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { replied_on, content } = req.body;
        const user = req.user?._id;

        const body = content.trim();
        if(!replied_on || !body) {
            res.status(400).json({
                success: false, 
                message: "Missing Fields"
            });
            return ;
        }

        const msg = checkBody(body);
        if(msg != "valid") {
            res.status(400).json({
                success: false,
                message: msg
            })
            return ;
        }

        const comment = await Comment.findById(replied_on);
        if(!comment) {
            res.status(400).json({
                success: false,
                message: "Comment does not exist"
            });
            return ;
        }

        const duplicate = await Reply.findOne({
            body,
            replied_on,
            replied_by: user
        });
        if(duplicate) {
            res.status(400).json({
                success: false,
                message: "Reply Already Exists"
            })
            return ;
        }

        const reply = await Reply.create({
            body,
            replied_on,
            replied_by: user,
            root: comment?.commented_on
        });

        await Comment.findByIdAndUpdate(comment?._id, {$push: {replies: reply._id}});
        res.status(200).json({
            success: true,
            message: "Reply added Successfully",
            reply: reply
        });

    } catch(err) {
        console.error("[Reply Creation Error]:", err);
        res.status(500).json({
            success: false,
            message: "Reply Creation Failed",
            error: err
        });
    }
}

const updateReply = async(req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { reply_id, content }  = req.body;
        const user = req.user?._id;

        const body = content.trim();
        if(!reply_id || !body) {
            res.status(400).json({
                success: false,
                message: "Missing Fields"
            });
            return ;
        }

        const msg = checkBody(body);
        if(msg != "valid") {
            res.status(400).json({
                success: false,
                message: msg
            })
            return ;
        }   

        const reply = await Reply.findById(reply_id);
        if(!reply) {
            res.status(400).json({
                success: false,
                message: "Reply Does Not Exist"
            });
            return ;
        }

        if(reply.replied_by?.toString() !== user) {
            res.status(400).json({
                success: true,
                message: "You are not authorized to alter this reply"
            });
            return ;
        }

        const updatedReply = await Reply.findByIdAndUpdate(reply_id, {body}, {new: true});
        res.status(200).json({
            success: true,
            message: "Reply Updated Successfully",
            reply: updatedReply
        });

    } catch(err) {
        console.error("[Reply Updation Error]:", err);
        res.status(500).json({
            success: false,
            message: "Reply Updation Failed",
            error: err
        });
    }
}

const DeleteReply = async(req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { reply_id } = req.body;
        const user = req.user?._id;
        if(!reply_id) {
            res.status(400).json({
                success: false,
                message: "Missing Field"
            })
            return ;
        }

        const reply = await Reply.findById(reply_id);
        if(!reply) {
            res.status(400).json({
                success: false,
                message: "Reply Does Not Exist"
            });
            return ;
        }

        if(reply.replied_by?.toString() !== user) {
            res.status(403).json({
                success: true,
                message: "You are not authorized to delete this reply"
            });
            return ;
        }

        await Like.deleteMany({liked_on: reply_id})
        await Dislike.deleteMany({liked_on: reply_id})
        await Reply.findByIdAndDelete(reply_id);
    } catch(err) {
        console.error("[Reply Deletion Error]:", err);
        res.status(500).json({
            success: false,
            message: "Reply Deletion Failed",
            error: err
        });
    }
}