import AuthRequest from "../utils/authRequest.ts";
import { Response } from "express";
import dotenv from "dotenv"
import User from "../models/User.ts";
dotenv.config();

export const reload = async(req: AuthRequest, res:Response):Promise<void> => {
    try {
        const userID = req.user?._id;
        if(!userID) {
            res.status(401).json({
                success: false,
                message: "Not Authenticated"
            });
            return ;
        }

        const user = await User.findById(userID).lean();
        if(!user) {
            res.status(404).json({
                success: false,
                message: "User Not Found"
            })
            return ;
        }

        res.status(200).json({
            success: true,
            user: user
        })

    } catch (err) {
        if(process.env.NODE_ENV !== "production") console.error("User Authentication Failed on Reload", err);
        res.status(500).json({
            success: false,
            message: "User Authentication Failed on Reload"
        });
    }
}