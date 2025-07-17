import express from "express";
import { signup, createAccount } from "../controllers/signup.ts";
import { login } from "../controllers/login.ts";
import { refreshToken } from "../controllers/refreshToken.ts";
import { createPost, editPost, deletePost } from "../controllers/post.ts";
import { verifyAccessToken } from "../middleware/auth.ts";
import { addLike, removeLike } from "../controllers/like.ts";
import { createComment, editComment, deleteComment } from "../controllers/comment.ts";
import { rateLimiterLow } from "../middleware/rateLimiterLow.ts";
import { rateLimiterModerate } from "../middleware/rateLimiterModerate.ts";
import { rateLimiterHigh } from "../middleware/rateLimiterHigh.ts";
import { createReply, editReply, deleteReply } from "../controllers/reply.ts";
import { addDislike, removeDislike } from "../controllers/dislike.ts";
import { boostrapAdmin } from "../controllers/boostrspAdmin.ts";
import { adminOnly } from "../middleware/adminOnly.ts";
import { promoteUser, demoteAdmin, getAllAdmins } from "../controllers/admin.ts";
import { createChannel, editChannel, deleteChannel } from "../controllers/channel.ts";
import { deleteAccount } from "../controllers/deleteAccount.ts";
import { reload } from "../controllers/reload.ts";

const route = express.Router();

// admin only routes
// admin 
route.post("/bootstrap-admin", boostrapAdmin); 
route.put("/user-promote", verifyAccessToken, adminOnly, promoteUser); 
route.put("/admin-demote", verifyAccessToken, adminOnly, demoteAdmin); 
route.get("/admins", verifyAccessToken, adminOnly, getAllAdmins); 

// channel
route.post("/channel-create", verifyAccessToken, adminOnly, createChannel); 
route.put("/channel-edit", verifyAccessToken, adminOnly, editChannel); 
route.delete("/channel-delete", verifyAccessToken, adminOnly, deleteChannel);

// user routes
// user
route.get("/reload", reload);

route.post("/signup", rateLimiterLow, signup); 
route.post("/create-account", rateLimiterLow, createAccount); 
route.post("/login", rateLimiterLow, login); 
route.post("/refresh-token", rateLimiterLow, refreshToken); 
route.delete("/delete-account", deleteAccount);

// post
route.post("/post-create", rateLimiterLow, verifyAccessToken, createPost);
route.put("/post-edit", rateLimiterModerate, verifyAccessToken, editPost);
route.delete("/post-delete", rateLimiterHigh, verifyAccessToken, deletePost);

// like/dislike
route.post("/like-add", rateLimiterHigh, verifyAccessToken, addLike);
route.delete("/like-remove", rateLimiterHigh, verifyAccessToken, removeLike)
route.post("/dislike-add", rateLimiterHigh, verifyAccessToken, addDislike);
route.delete("/dislike-remove", rateLimiterHigh, verifyAccessToken, removeDislike)

// comment
route.post("/comment-create",rateLimiterLow, verifyAccessToken, createComment);
route.put("/comment-edit", rateLimiterModerate, verifyAccessToken, editComment);
route.delete("/comment-delete",rateLimiterHigh, verifyAccessToken, deleteComment);

// reply
route.post("/reply-create",rateLimiterLow, verifyAccessToken, createReply);
route.put("/reply-edit", rateLimiterModerate, verifyAccessToken, editReply);
route.delete("/reply-delete",rateLimiterHigh, verifyAccessToken, deleteReply);

export default route;   