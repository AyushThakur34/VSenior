import Post from "../models/Post";
import Channel from "../models/Channel";
import { Response } from "express";
import AuthRequest from "../utils/authRequest";
import dotenv from "dotenv";
dotenv.config();

export const createPost = async(req: AuthRequest, res: Response): Promise<void>=> {
    try {
        const { title, body, channelID} = req.body;
        const userID = req.user?._id;
        if(!title || !body || userID) {
            res.status(400).json({
                success: false,
                message: "Title, Body and UserID required"
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
