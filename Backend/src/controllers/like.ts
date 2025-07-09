import Like from "src/models/Like";
import Dislike from "src/models/Dislike";
import { Response } from "express";
import AuthRequest from "src/utils/authRequest";
import Channel from "src/models/Channel";
import Post from "src/models/Post";
import Comment from "src/models/Comment";
import Reply from "src/models/Reply";
import dotenv from "dotenv";
dotenv.config();

export const addLike = async(req: AuthRequest, res: Response):Promise<void>=> {
    try {
        const { liked_on, on_model, channel_id} =  req.body;
        const userID = req.user?._id;
        const member = req.user?.private_member;

        if(!liked_on || !on_model || !channel_id) { // handle missing fields
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

        const alreadyLiked = await Like.findOne({liked_by: userID, liked_on: liked_on, on_model}).lean();
        if(alreadyLiked) { // handle if the item is already liked by the same user
            res.status(400).json({
                success: false,
                message: "Parent is already liked by the user"
            }); 
            return ;
        }
                
        let parent: any;
        if(on_model === "Post") parent = await Post.findByIdAndUpdate(liked_on, {$inc: {like_count: +1}});
        else if(on_model === "Comment") parent = await Comment.findByIdAndUpdate(liked_on, {$inc: {like_count: +1}});
        else if(on_model === "Reply") parent = await Reply.findByIdAndUpdate(liked_on, {$inc: {like_count: +1}});
        else parent = null;

        if(!parent) { // handle the case where parent does not exist
            res.status(404).json({
                success: false,
                message: "Parent Not Found"
            });
            return ;
        }

        const like = await Like.create({ // if everything is passed create like
            liked_by: userID,
            liked_on: parent._id,
            on_model
        })

        let parentDoc: any;
        if(on_model === "Post") {
            parentDoc = await Post.findById(parent._id).lean()
            const prevDislike = await Dislike.findOneAndDelete({disliked_on: liked_on, disliked_by: userID, on_model}).lean();
            if(prevDislike) parentDoc = await Post.findByIdAndUpdate(parent._id, {$inc:{dislike_count: -1}}, {new: true}).lean();
        }
        else if(on_model === "Comment") {
            parentDoc = await Comment.findById(parent._id).lean()
            const prevDislike = await Dislike.findOneAndDelete({disliked_on: liked_on, disliked_by: userID, on_model}).lean();
            if(prevDislike) parentDoc = await Comment.findByIdAndUpdate(parent._id, {$inc:{dislike_count: -1}}, {new: true}).lean();
        }
        else {
            parentDoc = await Reply.findById(parent._id).lean()
            const prevDislike = await Dislike.findOneAndDelete({disliked_on: liked_on, disliked_by: userID, on_model}).lean();
            if(prevDislike) parentDoc = await Reply.findByIdAndUpdate(parent._id, {$inc:{dislike_count: -1}}, {new: true}).lean();
        }
        

        res.status(200).json({
            success: true,
            message: "Parent Liked Successfully",
            like_count: parentDoc.like_count,
            dislike_count: parentDoc.dislike_count
        });
    } catch(err) {
        if (process.env.NODE_ENV !== "production") console.error("[Like Adding Error]:", err);
        res.status(500).json({
            success: false,
            message: "Error While Adding Like",
        });
    }
}

export const removeLike = async(req: AuthRequest, res: Response):Promise<void>=> {
    try {
        const { liked_on, on_model, channel_id } = req.body;
        const userID = req.user?._id;
        const member = req.user?.private_member;

        if(!liked_on || !on_model || !channel_id) { // handle missing fields
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

        const liked = await Like.findOneAndDelete({liked_by: userID, liked_on: liked_on, on_model}).lean() // check if such like exists in db
        if(!liked) { // handle the case like does not exist
            res.status(400).json({
                success: false,
                message: "Parent is Not Liked"
            });
            return ;
        }

        let parent: any;
        if(on_model === "Post") parent = await Post.findByIdAndUpdate(liked_on, {$inc: {like_count: -1}});
        else if(on_model === "Comment") parent = await Comment.findByIdAndUpdate(liked_on, {$inc: {like_count: -1}});
        else if(on_model === "Reply") parent = await Reply.findByIdAndUpdate(liked_on, {$inc: {like_count: -1}});
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
            message: "Like Removed Successfully",
            like_count: parent.like_count,
            dislike_count: parent.dislike_count
        });

    } catch(err) {
        if (process.env.NODE_ENV !== "production") console.error("[Like Removing Error]:", err);
        res.status(500).json({
            success: false,
            message: "Error While Removing Like",
        });
    }
}