import Comment from "../models/Comment.ts";
import AuthRequest from "../utils/authRequest.ts";
import { Response } from "express";
import Reply from "../models/Reply.ts";
import checkBody from "../utils/checkBody.ts";
import Like from "../models/Like.ts";
import Dislike from "../models/Dislike.ts";
import Channel from "../models/Channel.ts";

export const createReply = async(req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { replied_on, channel_id } = req.body;
        const body = req.body.body?.trim();
        const userID = req.user?._id;
        const member = req.user?.private_member;

        if(!replied_on || !body || !channel_id) { // handle missing fields
            res.status(400).json({
                success: false, 
                message: "Missing Fields"
            });
            return ;
        }

        const channel = await Channel.findById(channel_id); // check for private college channel
        if(channel?.type === "college" && !member) {
            res.status(403).json({
                success: false,
                message: "You are not authorized to make changes in this channel"
            });
            return ;
        }

        const msg = checkBody(body); // check for body validity
        if(msg != "valid") {
            res.status(400).json({
                success: false,
                message: msg
            })
            return ;
        }

        const existingComment = await Comment.findById(replied_on).lean();
        if(!existingComment) {
            res.status(400).json({
                success: false,
                message: "Comment does not exist"
            });
            return ;
        }

        const comment = await Comment.findByIdAndUpdate(existingComment._id, {$inc: {reply_count: +1}}, {new:true}).lean();

        const reply = await Reply.create({
            body,
            replied_on: existingComment._id,
            replied_by: userID,
        });

        res.status(200).json({
            success: true,
            message: "Reply added Successfully",
            reply: reply,
            reply_count: comment?.reply_count
        });

    } catch(err) {
        if (process.env.NODE_ENV !== "production") console.error("[Reply Creation Error]:", err);
        res.status(500).json({
            success: false,
            message: "Reply Creation Failed",
        });
    }
}

export const editReply = async(req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { reply_id, channel_id }  = req.body;
        const body = req.body.body?.trim();
        const userID = req.user?._id;
        const member = req.user?.private_member;

        if(!reply_id || !body || !channel_id) { // handle missing fields
            res.status(400).json({
                success: false,
                message: "Missing Fields"
            });
            return ;
        }

        const channel = await Channel.findById(channel_id); // handle private college channel
        if(channel?.type === "college" && !member) {
            res.status(403).json({
                success: false,
                message: "You are not authorized to make changes in this channel"
            });
            return ;
        }

        const reply = await Reply.findById(reply_id); // check if reply exist
        if(!reply) {
            res.status(400).json({
                success: false,
                message: "Reply Does Not Exist"
            });
            return ;
        }
        else if(body === reply.body) { // check for unchanged body
            res.status(400).json({
                success: false,
                message: "Body Unchanged"
            });
            return ;
        }
        else {
            const msg = checkBody(body); // check for valid content
            if(msg != "valid") {
                res.status(400).json({
                    success: false,
                    message: msg
                })
                return ;
            }   
        }

        if(reply.replied_by !== userID) { // check for user authorization
            res.status(400).json({
                success: false,
                message: "Unauthorized"
            });
            return ;
        }

        const updatedReply = await Reply.findByIdAndUpdate(reply_id, {body}, {new: true}).lean();
        res.status(200).json({
            success: true,
            message: "Reply Updated Successfully",
            reply: updatedReply
        });

    } catch(err) {
        if (process.env.NODE_ENV !== "production") console.error("[Reply Updation Error]:", err);
        res.status(500).json({
            success: false,
            message: "Reply Updation Failed",
        });
    }
}

export const deleteReply = async(req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { reply_id, channel_id } = req.body;
        const user = req.user?._id;
        const member = req.user?.private_member;

        if(!reply_id || !channel_id) { // check for missing fields
            res.status(400).json({
                success: false,
                message: "Missing Field"
            })
            return ;
        }

        const channel = await Channel.findById(channel_id).lean(); // handle private college channel
        if(channel?.type === "college" && !member) {
            res.status(403).json({
                success: false,
                message: "You are not authorized to make changes in this channel"
            });
            return ;
        }

        const reply = await Reply.findById(reply_id).lean();
        if(!reply) {
            res.status(400).json({
                success: false,
                message: "Reply Does Not Exist"
            });
            return ;
        }
        else if(reply.replied_by !== user) { // check for user authority over reply
            res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
            return ;
        }


        // delete every related data about reply
        const likes = await Like.find({liked_on: reply._id}).select("_id");
        const likeIDs = likes.map(l => l._id);

        const dislikes = await Dislike.find({disliked_on: reply._id}).select("_id");
        const dislikeIDs = dislikes.map(d => d._id);

        await Promise.all([
            Like.deleteMany({_id:{$in: likeIDs}}),
            Dislike.deleteMany({_id:{$in: dislikeIDs}}),
            Reply.findByIdAndDelete(reply._id).lean() 
        ]);

        const comment = await Comment.findByIdAndUpdate(reply.replied_on, {$inc: {reply_count: -1}});

        res.status(200).json({
            success: true,
            message: "Reply Deleted Successfully",
            reply_count: comment?.reply_count
        });

    } catch(err) {
        if (process.env.NODE_ENV !== "production") console.error("[Reply Deletion Error]:", err);
        res.status(500).json({
            success: false,
            message: "Reply Deletion Failed",
        });
    }
}