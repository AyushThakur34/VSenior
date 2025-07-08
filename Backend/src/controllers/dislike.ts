import Like from "src/models/Like";
import Dislike from "src/models/Dislike";
import Post from "src/models/Post";
import Comment from "src/models/Comment";
import { Response } from "express";
import AuthRequest from "src/utils/authRequest";
import Reply from "src/models/Reply";
import Channel from "src/models/Channel";

export const addDislike = async(req: AuthRequest, res: Response):Promise<void>=> {
    try {
        const { disliked_on, on_model, channel_id } =  req.body;
        const user = req.user?._id;

        if(!disliked_on || !on_model || !channel_id) { // handle missing fields
            res.status(400).json({
                success: false,
                message: "Missing Fields"
            });
            return ;
        }

        const channel = await Channel.findById(channel_id);
        if(channel?.type === "college") {
            const Member = channel.members.some(member => member.toString() === user);
            if(!Member) {
                res.status(403).json({
                    success: false,
                    message: "You are not authorized to make changes in this channel"
                });
                return ;
            }
        }

        const alreadyDisliked = await Dislike.findOne({disliked_by: user, disliked_on, on_model});
        if(alreadyDisliked) { // handle if the item is already disliked by the same user
            res.status(400).json({
                success: false,
                message: "Parent is already disliked by the user"
            }); 
            return ;
        }
        
        let parent: any; // check on_model it should be Post, Comment or Reply
        if(on_model === "Post") parent = await Post.findById(disliked_on)
        else if(on_model === "Comment") parent = await Comment.findById(disliked_on);
        else if(on_model === "Reply") parent = await Reply.findById(disliked_on);
        else { // handle the case if model is invalid
            res.status(400).json({
                success: false,
                message: "Model Does Not Exist"
            });
            return ;
        }

        if(!parent) { // handle the case where parent does not exist
            res.status(404).json({
                success: false,
                message: "Parent not found"
            });
            return ;
        }

        const dislike = await Dislike.create({ // if everything is passed create dislike
            disliked_by: user,
            disliked_on: parent._id,
            on_model
        })

        let parentDoc: any; // store it into parentDoc and remove any like done by the user on the same item 
        if(on_model === "Post") {
            parentDoc = await Post.findByIdAndUpdate(parent._id, {$push:{dislikes: dislike._id}}, {new: true});
            const prevLike = await Like.findOne({liked_on: disliked_on, liked_by: user, on_model});
            if(prevLike) {
                parentDoc = await Post.findByIdAndUpdate(parent._id, {$pull:{likes: prevLike._id}}, {new: true});
                await Like.findByIdAndDelete(prevLike._id);
            }
        }
        else if(on_model === "Comment") {
            parentDoc = await Comment.findByIdAndUpdate(parent._id, {$push:{dislikes: dislike._id}}, {new: true});
            const prevLike = await Like.findOne({liked_on: disliked_on, liked_by: user, on_model});
            if(prevLike) {
                parentDoc = await Comment.findByIdAndUpdate(parent._id, {$pull:{likes: prevLike._id}}, {new: true});
                await Like.findByIdAndDelete(prevLike._id);
            }
        }
        else {
           parentDoc = await Reply.findByIdAndUpdate(parent._id, {$push:{dislikes: dislike._id}}, {new: true});
            const prevLike = await Like.findOne({liked_on: disliked_on, liked_by: user, on_model});
            if(prevLike) {
                parentDoc = await Reply.findByIdAndUpdate(parent._id, {$pull:{likes: prevLike._id}}, {new: true});
                await Like.findByIdAndDelete(prevLike._id);
            } 
        }

        res.status(200).json({
            success: true,
            message: "Parent disliked Successfully",
            parent: parentDoc
        });
    } catch(err) {
        console.error("[dislike Adding Error]:", err);
        res.status(500).json({
            success: false,
            message: "Error While Adding dislike",
            error: err
        });
    }
}

export const removeDislike = async(req: AuthRequest, res: Response):Promise<void>=> {
    try {
        const {disliked_on, on_model, channel_id } = req.body;
        const user = req.user?._id;

        if(!disliked_on || !on_model || !channel_id) { // handle missing fields
            res.status(400).json({
                success: false,
                message: "Missing Fields"
            });
            return ;
        }

        const channel = await Channel.findById(channel_id);
        if(channel?.type === "college") {
            const Member = channel.members.some(member => member.toString() === user);
            if(!Member) {
                res.status(403).json({
                    success: false,
                    message: "You are not authorized to make changes in this channel"
                });
                return ;
            }
        }

        let parent: any; // check on_model it should be Post , Comment or Reply
        if(on_model === "Post") parent = await Post.findById(disliked_on)
        else if(on_model === "Comment") parent = await Comment.findById(disliked_on);
        else if(on_model === "Reply") parent = await Reply.findById(disliked_on);
        else {
            res.status(400).json({
                success: false,
                message: "Model Does Not Exist"
            });
            return ;
        }

        if(!parent) { // handle the case where parent does not exist
            res.status(404).json({
                success: false,
                message: "Parent not found"
            });
            return ;
        }

        const disliked = await Dislike.findOne({disliked_by: user, disliked_on, on_model}) // check if such dislike exists in db
        if(!disliked) { // handle the case if not
            res.status(400).json({
                success: false,
                message: "Parent is not Disliked"
            });
            return ;
        }

        let parentDoc: any; // remove disliked from parent
        if(on_model === "Post") parentDoc = await Post.findByIdAndUpdate(disliked_on, {$pull: {dislikes: disliked._id}}, {new: true});
        else if(on_model === "Comment") parentDoc = await Comment.findByIdAndUpdate(disliked_on, {$pull: {dislikes: disliked._id}}, {new: true});
        else parentDoc = await Reply.findByIdAndUpdate(disliked_on, {$pull: {dislikes: disliked._id}}, {new: true});

        await Dislike.findByIdAndDelete(disliked._id); // remove dislike from db

        res.status(200).json({
            success: true,
            message: "Dislike Removed Successfully",
            parent: parentDoc
        });

    } catch(err) {
        console.error("[Dislike Removing Error]:", err);
        res.status(500).json({
            success: false,
            message: "Error While Removing dislike",
            error: err
        });
    }
}