import express from "express";
import { signup, createAccount } from "../controllers/signup";
import { login } from "../controllers/login";
import { refreshToken } from "../controllers/refreshToken";
import { createPost, editPost, deletePost } from "../controllers/post";
import { verifyAccessToken } from "../middleware/auth";
import { addLike, removeLike } from "src/controllers/like";
import { createComment, editComment, deleteComment } from "src/controllers/comment";
import { AddCommentRateLimiter, UpdateCommentRateLimiter, DeleteCommentRateLimiter } from "src/middleware/commentRateLimiter";

const route = express.Router();

route.post("/signup", signup);
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