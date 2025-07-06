import express from "express";
import { signup, createAccount } from "../controllers/signup";
import { login } from "../controllers/login";
import { refreshToken } from "../controllers/refreshToken";
import { createPost, editPost, deletePost } from "../controllers/post";
import { verifyAccessToken } from "../middleware/auth";
import { addLike, removeLike } from "src/controllers/like";

const route = express.Router();

route.post("/signup", signup);
route.post("/create-account", createAccount);
route.post("/login", login);
route.post("/refresh-token", refreshToken);
route.post("/post-create", verifyAccessToken, createPost);
route.post("/post-edit", verifyAccessToken, editPost);
route.post("/post-delete", verifyAccessToken, deletePost);
route.post("/like-add", verifyAccessToken, addLike);
route.post("/like-remove", verifyAccessToken, removeLike)


export default route;   