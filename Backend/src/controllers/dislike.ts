import Like from "../models/Like.ts";
import Dislike from "../models/Dislike.ts";
import { Response } from "express";
import AuthRequest from "../utils/authRequest.ts";
import Channel from "../models/Channel.ts";
import Post from "../models/Post.ts";
import Comment from "../models/Comment.ts";
import Reply from "../models/Reply.ts";
import dotenv from "dotenv";
dotenv.config();

export const addDislike = async(req: AuthRequest, res: Response):Promise<void>=> {
    try {
        const { disliked_on, on_model, channel_id} =  req.body;
        const userID = req.user?._id;
        const member = req.user?.private_member;

        if(!disliked_on || !on_model || !channel_id) { // handle missing fields
            res.status(400).json({
                success: false,
                message: "Missing Fields"
            });
            return ;
        }

        const channel = await Channel.findById(channel_id).lean();
        if(channel?.type === "college" && !member) {
            res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
            return ;
        }

        const alreadyDisliked = await Like.findOne({disliked_by: userID, disliked_on: disliked_on, on_model}).lean();
        if(alreadyDisliked) { // handle if the item is already liked by the same user
            res.status(400).json({
                success: false,
                message: "Parent is already liked by the user"
            }); 
            return ;
        }
                
        let parent: any;
        if(on_model === "Post") parent = await Post.findByIdAndUpdate(disliked_on, {$inc: {dislike_count: +1}});
        else if(on_model === "Comment") parent = await Comment.findByIdAndUpdate(disliked_on, {$inc: {dislike_count: +1}});
        else if(on_model === "Reply") parent = await Reply.findByIdAndUpdate(disliked_on, {$inc: {dislike_count: +1}});
        else parent = null;

        if(!parent) { // handle the case where parent does not exist
            res.status(404).json({
                success: false,
                message: "Parent Not Found"
            });
            return ;
        }

        const dislike = await Dislike.create({ // if everything is passed create like
            disliked_by: userID,
            disliked_on: parent._id,
            on_model
        })

        let parentDoc: any;
        if(on_model === "Post") {
            parentDoc = await Post.findById(parent._id).lean()
            const prevLike = await Like.findOneAndDelete({liked_on: disliked_on, liked_by: userID, on_model}).lean();
            if(prevLike) parentDoc = await Post.findByIdAndUpdate(parent._id, {$inc:{like_count: -1}}, {new: true}).lean();
        }
        else if(on_model === "Comment") {
            parentDoc = await Comment.findById(parent._id).lean()
            const prevLike = await Like.findOneAndDelete({liked_on: disliked_on, liked_by: userID, on_model}).lean();
            if(prevLike) parentDoc = await Comment.findByIdAndUpdate(parent._id, {$inc:{like_count: -1}}, {new: true}).lean();
        }
        else {
            parentDoc = await Reply.findById(parent._id).lean()
            const prevLike = await Like.findOneAndDelete({liked_on: disliked_on, liked_by: userID, on_model}).lean();
            if(prevLike) parentDoc = await Reply.findByIdAndUpdate(parent._id, {$inc:{like_count: -1}}, {new: true}).lean();
        }
        

        res.status(200).json({
            success: true,
            message: "Parent Disliked Successfully",
            parent: parentDoc,
            like_count: parentDoc.like_count,
            dislike_count: parentDoc.dislike_count
        });
    } catch(err) {
        if (process.env.NODE_ENV !== "production") console.error("[Dislike Adding Error]:", err);
        res.status(500).json({
            success: false,
            message: "Error While Adding Dislike",
        });
    }
}

export const removeLike = async(req: AuthRequest, res: Response):Promise<void>=> {
    try {
        const { disliked_on, on_model, channel_id } = req.body;
        const userID = req.user?._id;
        const member = req.user?.private_member;

        if(!disliked_on || !on_model || !channel_id) { // handle missing fields
            res.status(400).json({
                success: false,
                message: "Missing Fields"
            });
            return ;
        }

        const channel = await Channel.findById(channel_id).lean(); // check for private channel
        if(channel?.type === "college" && !member) {
            res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
            return ;
        }

        const disliked = await Dislike.findOneAndDelete({disliked_by: userID, disliked_on: disliked_on, on_model}).lean() // check if such like exists in db
        if(!disliked) { // handle the case like does not exist
            res.status(400).json({
                success: false,
                message: "Parent is Not Disliked"
            });
            return ;
        }

        let parent: any;
        if(on_model === "Post") parent = await Post.findByIdAndUpdate(disliked_on, {$inc: {dislike_count: -1}});
        else if(on_model === "Comment") parent = await Comment.findByIdAndUpdate(disliked_on, {$inc: {dislike_count: -1}});
        else if(on_model === "Reply") parent = await Reply.findByIdAndUpdate(disliked_on, {$inc: {dislike_count: -1}});
        else parent = null;

        if(!parent) { // handle the case where parent does not exist
            res.status(404).json({
                success: false,
                message: "Parent Not Found"
            });
            return ;
        }

        res.status(200).json({
            success: true,
            message: "Dislike Removed Successfully",
            like_count: parent.like_count,
            dislike_count: parent.dislike_count
        });

    } catch(err) {
        if (process.env.NODE_ENV !== "production") console.error("[Dislike Removing Error]:", err);
        res.status(500).json({
            success: false,
            message: "Error While Removing Dislike",
        });
    }
}