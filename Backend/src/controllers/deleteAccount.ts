import User from "../models/User.ts";
import Like from "../models/Like.ts";
import Dislike from "../models/Dislike.ts";
import Post from "../models/Post.ts";
import Comment from "../models/Comment.ts";
import Reply from "../models/Reply.ts";
import Channel from "../models/Channel.ts";
import dotenv from "dotenv";
import { Response } from "express";
import AuthRequest from "../utils/authRequest.ts";
dotenv.config();

export const deleteAccount = async(req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user_id = req.body.user_id;
        const id = req.user?._id;
        const role = req.user?.role;

        if(!user_id) {
            res.status(400).json({
                success: false,
                message: "Missing Field"
            });
            return ;
        }

        if(role === "admin" || role === "super_admin" || user_id === id?.toString()) {
            const user = await User.findById(user_id).lean();
            if(!user) {
                res.status(404).json({
                    success: false,
                    message: "User Not Found"
                });
                return ;
            }

            // posts created by user
            const posts = await Post.find({posted_by: user._id}).select("_id posted_on");
            const postIDs = posts.map(p => p._id);
            
            const postCountMap = new Map<string, number>();
            for(const post of posts) {
                const channelID = post.posted_on.toString();
                postCountMap.set(channelID, (postCountMap.get(channelID) || 0) + 1);
            }

            const channelUpdateOps = [];
            for(const [channelID, count] of postCountMap.entries()) {
                channelUpdateOps.push(
                    Channel.updateOne(
                        {_id: channelID},
                        {$inc: {post_count: -count}}
                    )
                );
            }

            // comments created by user or their posts
            const commentOnPost = await Comment.find({commented_on: {$in: postIDs}}).select("_id");
            const CommentByUser = await Comment.find({comment_by: user._id}).select("_id");
            const commentIDs = [...commentOnPost, ...CommentByUser].map(c => c._id);

            // replies made by user or on their comments
            const replyOnComments = await Reply.find({replied_on: {$in: commentIDs}}).select("_id");
            const replyByUser = await Reply.find({replied_by: user._id}).select("_id");
            const replyIDs = [...replyOnComments, ...replyByUser].map(r => r._id);

            await Promise.all([
                Like.deleteMany({
                    $or: [
                        {liked_by: user._id},
                        {liked_on: {$in: [...postIDs, ...commentIDs, ...replyIDs]}}
                    ]
                }),
                Dislike.deleteMany({
                    $or: [
                        {disliked_by: user._id},
                        {disliked_on: {$in: [...postIDs, ...commentIDs, ...replyIDs]}}
                    ]
                }),
                Reply.deleteMany({_id: {$in: replyIDs}}),
                Comment.deleteMany({_id: {$in: commentIDs}}),
                ...channelUpdateOps,
                Post.deleteMany({_id: {$in: postIDs}}),
                User.findByIdAndDelete(user._id)
            ]);
            
            res.status(200).json({
                success: true,
                message: "User and all associated content deleted successfully"
            });
        }
        else {
            res.status(403).json({
                success: false,
                message: "You are not authorized to delete this account"
            });
        }
    } catch(err) {
        if(process.env.NODE_ENV !== "production") console.error(err);
        res.status(500).json({
            success: false,
            message: "Error while account deletion"
        });
    }
}