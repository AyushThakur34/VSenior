import express from "express";
import { signup, createAccount } from "../controllers/signup.ts";
import { login } from "../controllers/login.ts";
import { refreshToken } from "../controllers/refreshToken.ts";
import { createPost, editPost, deletePost } from "../controllers/post.ts";
import { verifyAccessToken } from "../middleware/auth.ts";
import { addLike, removeLike } from "../controllers/like.ts";
import { createComment, editComment, deleteComment } from "../controllers/comment.ts";
import { AddCommentRateLimiter, UpdateCommentRateLimiter, DeleteCommentRateLimiter } from "../middleware/commentRateLimiter.ts";
import { SignupRateLimiter } from "../middleware/signupRateLimiter.ts";

const route = express.Router();

route.post("/signup", SignupRateLimiter, signup);
route.post("/create-account", createAccount);
route.post("/login", login);
route.post("/refresh-token", refreshToken);

route.post("/post-create", verifyAccessToken, createPost);
route.put("/post-edit", verifyAccessToken, editPost);
route.delete("/post-delete", verifyAccessToken, deletePost);

route.post("/like-add", verifyAccessToken, addLike);
route.delete("/like-remove", verifyAccessToken, removeLike)

route.post("/comment-create", verifyAccessToken, AddCommentRateLimiter, createComment);
route.put("/comment-edit", verifyAccessToken, UpdateCommentRateLimiter, editComment);
route.delete("/comment-delete", verifyAccessToken, DeleteCommentRateLimiter, deleteComment);

export default route;   