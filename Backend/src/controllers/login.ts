import User from "../models/User";
import bcrypt from "bcrypt";
import validator from "validator";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import RefreshToken from "../models/RefreshToken";
import { Request, Response } from "express";
dotenv.config();

export const login = async(req: Request, res: Response): Promise<void>=> {
    try {
        const password = req.body.passed?.trim(); 
        const email = req.body.email?.toLowerCase().trim();
        if(!email || !password) { // handle missing fields
            res.status(400).json({
                success: false,
                message: "Email and Password Both are Required"
            });
            return ;
        }

        if(!validator.isEmail(email)) { // validate email format
            res.status(400).json({
                success: false,
                message: "Enter a Valid Email"
            });
            return ;
        }

        const existingUser = await User.findOne({email: email}).select("+password"); // find existing user
        if(!existingUser) { // handle the case if user does not exist
            res.status(400).json({
                success: false,
                message: "Email Not Registered"
            });
            return ;
        }
        
        const hashedPassword: string = existingUser.password as string; // fetch the stored hashed password from db
        
        const match = await bcrypt.compare(password, hashedPassword); // match the given password with hashed password
        if(!match) { // handle the case if password does not match
            res.status(400).json({
                success: false,
                message: "Incorrect Password"
            });
            return ;
        }

        const accessToken = jwt.sign( // sign an access token
            {id: existingUser._id, username: existingUser.username, email, private_member: existingUser.private_member},
            process.env.JWT_ACCESS_SECRET!, 
            {expiresIn:"15m"}
        );

        res.cookie("accessToken", accessToken, { // send it into cookie
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 15 * 60 * 1000
        });

        const refreshToken = jwt.sign( // make a refresh token
            {id: existingUser._id},
            process.env.JWT_REFRESH_SECRET!,
            {expiresIn:"7d"}
        )

        res.cookie("refreshToken", refreshToken, { // send it into cookie
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        await RefreshToken.deleteMany({userID: existingUser._id}); // clean up old refresh token
        await RefreshToken.create({ // store the refresh token into db
            token: refreshToken,
            userID: existingUser._id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        const userToSend = existingUser.toObject() as any;
        delete userToSend.password;
        res.status(200).json({
            success: true,
            message: "Login Successful",
            user: userToSend
        });
        
    } catch(err) {
        if (process.env.NODE_ENV !== "production") console.error("[Login error]:", err);
        res.status(500).json({
            success: false,
            message: "Login Failed",
        });
    }
}