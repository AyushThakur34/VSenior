import express from "express";
import { signup, createAccount } from "../controllers/signup";
import { login } from "../controllers/login";
import { refreshToken } from "../controllers/refreshToken";
import { createPost } from "../controllers/post";
import { verifyAccessToken } from "../middleware/auth";

const route = express.Router();

route.post("/signup", signup);
route.post("/create-account", createAccount);
route.post("/login", login);
route.post("/refresh-token", refreshToken);
route.post("/create-post", verifyAccessToken, createPost);


export default route;   