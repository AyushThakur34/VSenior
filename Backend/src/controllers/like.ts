import Like from "src/models/Like";
import Dislike from "src/models/Dislike";
import Post from "src/models/Post";
import Comment from "src/models/Comment";
import { Response } from "express";
import AuthRequest from "src/utils/authRequest";
import Reply from "src/models/Reply";

export const addLike = async(req: AuthRequest, res: Response):Promise<void>=> {
    try {
        const { liked_on, on_model } =  req.body;
        const user = req.user?._id;

        if(!liked_on || !on_model) { // handle missing fields
            res.status(400).json({
                success: false,
                message: "Missing Fields"
            });
            return ;
        }

        const alreadyLiked = await Like.findOne({liked_by: user, liked_on: liked_on, on_model});
        if(alreadyLiked) { // handle if the item is already liked by the same user
            res.status(400).json({
                success: false,
                message: "Parent is already liked by the user"
            }); 
            return ;
        }
        
        let parent: any; // check on_model it should be Post or Comment
        if(on_model === "Post") parent = await Post.findById(liked_on)
        else if(on_model === "Comment") parent = await Comment.findById(liked_on);
        else if(on_model === "Reply") parent = await Reply.findById(liked_on);
        
        else {
            res.status(400).json({
                success: false,
                message: "Parent Does Not Exist"
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

        const like = await Like.create({ // if everything is passed create liked
            liked_by: user,
            liked_on: parent._id,
            on_model
        })

        let parentDoc: any; // store it into parent and remove any dislike done by the user on the same item 
        if(on_model === "Post") {
            parentDoc = await Post.findByIdAndUpdate(parent._id, {$push:{likes: like._id}}, {new: true});
            const prevDislike = await Dislike.findOne({disliked_on: liked_on, disliked_by: user, on_model});
            if(prevDislike) {
                parentDoc = await Post.findByIdAndUpdate(parent._id, {$pull:{dislikes: prevDislike._id}}, {new: true});
                await Dislike.findByIdAndDelete(prevDislike._id);
            }
        }
        else if(on_model === "Comment") {
            parentDoc = await Comment.findByIdAndUpdate(parent._id, {$push:{likes: like._id}}, {new: true});
            const prevDislike = await Dislike.findOne({disliked_on: liked_on, disliked_by: user , on_model});
            if(prevDislike) {
                parentDoc = await Comment.findByIdAndUpdate(parent._id, {$pull:{dislikes: prevDislike._id}}, {new: true});
                await Dislike.findByIdAndDelete(prevDislike._id);
            }
        }
        else {
            parentDoc = await Reply.findByIdAndUpdate(parent._id, {$push:{likes: like._id}}, {new: true});
            const prevDislike = await Dislike.findOne({disliked_on: liked_on, disliked_by: user , on_model});
            if(prevDislike) {
                parentDoc = await Reply.findByIdAndUpdate(parent._id, {$pull:{dislikes: prevDislike._id}}, {new: true});
                await Dislike.findByIdAndDelete(prevDislike._id);
            }
        }

        res.status(200).json({
            success: true,
            message: "Parent Liked Successfully",
            parent: parentDoc
        });
    } catch(err) {
        console.error("[Like Adding Error]:", err);
        res.status(500).json({
            success: false,
            message: "Error While Adding Like",
            error: err
        });
    }
}

export const removeLike = async(req: AuthRequest, res: Response):Promise<void>=> {
    try {
        const { liked_on, on_model } = req.body;
        const user = req.user?._id;

        if(!liked_on || !on_model) { // handle missing fields
            res.status(400).json({
                success: false,
                message: "Missing Fields"
            });
            return ;
        }

        let parent: any; // check on_model it should be Post or Comment
        if(on_model === "Post") parent = await Post.findById(liked_on)
        else if(on_model === "Comment") parent = await Comment.findById(liked_on);
        else if(on_model === "Reply") parent = await Reply.findById(liked_on);
        else {
            res.status(400).json({
                success: false,
                message: "Parent Does Not Exist"
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

        const liked = await Like.findOne({liked_by: user, liked_on: liked_on, on_model}) // check if such like exists in db
        if(!liked) { // handle the case if not
            res.status(400).json({
                success: false,
                message: "Parent is not liked"
            });
            return ;
        }

        let parentDoc: any; // remove liked from parent
        if(on_model === "Post") parentDoc = await Post.findByIdAndUpdate(liked_on, {$pull: {likes: liked._id}}, {new: true});
        else if(on_model === "Comment") parentDoc = await Comment.findByIdAndUpdate(liked_on, {$pull: {likes: liked._id}}, {new: true});
        else parentDoc = await Reply.findByIdAndUpdate(liked_on, {$pull: {likes: liked._id}}, {new: true});

        await Like.findByIdAndDelete(liked._id); // remove like from db

        res.status(200).json({
            success: true,
            message: "Like Removed Successfully",
            parent: parentDoc
        });

    } catch(err) {
        console.error("[Like Removing Error]:", err);
        res.status(500).json({
            success: false,
            message: "Error While Removing Like",
            error: err
        });
    }
}