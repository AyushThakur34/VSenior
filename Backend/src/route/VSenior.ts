import express from "express";
import { signup, createAccount } from "../controllers/signup";
import { login } from "../controllers/login";
import { refreshToken } from "../controllers/refreshToken";

const route = express.Router();

route.post("/signup", signup);
route.post("/create-account", createAccount);
route.post("/login", login);
route.post("/refresh-token", refreshToken);

export default route;