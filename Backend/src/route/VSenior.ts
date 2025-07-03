import express from "express";
import { signup, createAccount } from "../controllers/signup";

const route = express.Router();

route.post("/signup", signup);
route.post("/create-account", createAccount);

export default route;