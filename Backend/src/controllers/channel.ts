import Channel from "../models/Channel.ts";
import AuthRequest from "../utils/authRequest.ts";
import { Response } from "express";
import Post from "../models/Post.ts";
import Comment from "../models/Comment.ts";
import Like from "../models/Like.ts";
import Dislike from "../models/Dislike.ts";
import Reply from "../models/Reply.ts";
import User from "../models/User.ts";
import dotenv from "dotenv";
dotenv.config();

export const createChannel = async(req: AuthRequest, res: Response): Promise<void> => {
    try {
        const {channel_name, type } = req.body;
        if(!channel_name || !type) {
            res.status(400).json({
                success: false,
                message: "Missing Fields"
            });
            return ;
        }
    
        const name = channel_name.toLowerCase().trim();
        const existingChannel = await Channel.findOne({channel_name: name});
        if(existingChannel) {
            res.status(400).json({
                success: false,
                message: "Channel Already Exists"
            }); 
            return ;
        }

        if(type !== "open" && type != "college") {
            res.status(400).json({
                success: false,
                message: "Invalid Channel Type"
            });
            return ;
        }

        await Channel.create({
            channel_name: name,
            type
        });

        res.status(200).json({
            success: true,
            message: "Channel Created Successfully"
        });
    } catch(err) {
        if(process.env.NODE_ENV !== "production") console.error(err);
        res.status(500).json({
            success: false,
            message: "Error While Creating Channel"
        });
    }
}

export const editChannel = async(req: AuthRequest, res: Response): Promise<void> => {
    try {
        const {channel_id, channel_name, type } = req.body;
        if(!channel_id || !channel_name || !type) {
            res.status(400).json({
                success: false,
                message: "Missing Fields"
            });
            return ;
        }
    
        const name = channel_name.toLowerCase().trim();
        const existingChannel = await Channel.findById(channel_id);
        if(!existingChannel) {
            res.status(404).json({
                success: false,
                message: "Channel Not Found"
            });
            return ;
        }

        await Channel.findByIdAndUpdate(channel_id, {channel_name: name, type}).lean();
        res.status(200).json({
            success: true,
            message: "Channel Updated Successfully"
        })
    } catch(err) {
        if(process.env.NODE_ENV !== "production") console.error(err);
        res.status(500).json({
            success: false,
            message: "Error While Updating Channel"
        });
    }
}

export const deleteChannel = async(req: AuthRequest, res: Response): Promise<void> => {
    try {
        const channel_id = req.body.channel_id;
        if(!channel_id) {
            res.status(400).json({
                success: false,
                message: "Missing Field"
            });
            return ;
        }

        const existingChannel = await Channel.findById(channel_id).lean();
        if(!existingChannel) {
            res.status(404).json({
                success: false,
                message: "Channel Not Found"
            });
            return ;
        }

        const posts = await Post.find({posted_on: existingChannel._id}).select("_id posted_by");
        const postIDs = posts.map(p => p._id);

        const postCountMap = new Map<string, number>();
        for(const post of posts) {
            const userID = post.posted_by.toString();
            postCountMap.set(userID, (postCountMap.get(userID) || 0) + 1);
        }

        const userUpdateOps = [];
        for(const [userID, count] of postCountMap.entries()) {
            userUpdateOps.push(
                User.updateOne(
                    {_id: userID},
                    {$inc: {post_count: -count}}
                )
            );
        }

        const comments = await Comment.find({commented_on: {$in: postIDs}}).select("_id");
        const commentIDs = comments.map(c => c._id);

        const replies = await Reply.find({replied_on: {$in: commentIDs}}).select("_id");
        const replyIDs = replies.map(r => r._id);

        await Promise.all([
            Like.deleteMany({liked_on: {$in: [...postIDs, ...commentIDs, ...replyIDs]}}),
            Dislike.deleteMany({disliked_on: {$in: [...postIDs, ...commentIDs, ...replyIDs]}}),
            Reply.deleteMany({_id: {$in: replyIDs}}),
            Comment.deleteMany({_id: {$in: commentIDs}}),
            Post.deleteMany({_id: {$in: postIDs}}),
            ...userUpdateOps,
            Channel.findByIdAndDelete(channel_id)
        ]);

        res.status(200).json({
            success: true,
            message: "Channel Deleted Successfully"
        })
    } catch(err) {
        if(process.env.NODE_ENV !== "production") console.error(err);
        res.status(500).json({
            success: false,
            message: "Error While Deleting Channel"
        });
    }
}