import User from "../models/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";
import { sendVerificationEmail } from "../utils/mailer";
import isStrongPassword from "../utils/checkStrongPassword";
import cache from '../utils/cache';
import RefreshToken from "../models/RefreshToken";
import dotenv from "dotenv";
import { Request, Response } from "express";
dotenv.config();

// takes email and password as req
// verifies email and password format
// check for existing email
// encrypts the password and store it into cache
// verifiy user email by sending verification code
export const signup = async(req: Request, res: Response): Promise<void>=> {
    try {
        const { password } = req.body;
        const email = req.body.email?.toLowerCase().trim();
        if(!email || !password) { // handle missing fields
            res.status(400).json({
                success: false,
                message: "Email and Password are Required"
            });
            return ;
        }

        if(!validator.isEmail(email)) { // validate email format
            res.status(400).json({
                success: false,
                message: "Invalid Email Format"
            });
            return ;
        }

        const existingUser = await User.findOne({email}); 
        if(existingUser) { // handle the case for already registered email
            res.status(400).json({
                success: false,
                message: "Email Already Registered"
            });
            return ;
        }

        const emailReserved = cache.get(`lock:${email}`); // handle the case if multiple users are trying to signin with same email address
        if(emailReserved) {
            res.status(400).json({
                success: false,
                message: "Email is Already in Verification Process"
            });
            return ;
        }

        cache.set(`lock:${email}`, true, 600); // lock the email in cache before verifying it

        if(!isStrongPassword(password)) { // validate password format
            res.status(400).json({
                success: false,
                message: "Password must contain one uppercase, one lowercase, one digit, one special character and must be atleast 8 characters long"
            });
            return ;
        }

        const hashedPassword = await bcrypt.hash(password, 10); // encrypt the password

        cache.set(email, hashedPassword, 600); // store hashedPassword into cache

        const emailToken = jwt.sign({email}, process.env.JWT_SECRET!, {expiresIn: "10m"}); // sign emailToken

        try {
            await sendVerificationEmail(email, emailToken); // send verification email
        } catch(err) {
            cache.del(`lock:${email}`);
            console.error(err);
            res.status(400).json({
                success: false,
                message: "Failed to Send Verification Email"
            });
            return ;
        }
        
        res.status(200).json({
            success: true,
            message: "Email Verification Link Sent Successfully",
            token: emailToken
        });
        
    } catch(err) {
        if (process.env.NODE_ENV !== "production") console.error("[Registration Error:]",err);
        res.status(500).json({
            success: false,
            message: "Error While Registering Email",
        });
    }
};

// creates account after verifying user_email and username
export const createAccount = async(req: Request, res: Response): Promise<void>=> {
    try {
        const { token } = req.body;
        const username = req.body.username?.toLowerCase().trim();
        if(!token || !username) { // handle the case if token or username is missing from req body
            res.status(400).json({
                success: false,
                message: "Token and Username are Required"
            });
            return ;
        }

        const usernameRegex = /^[a-zA-Z0-9_]+$/; // test user case for validity 
        if (!usernameRegex.test(username)) {
            res.status(400).json({
                success: false,
                message: "Username can only contain letters, numbers, and underscores, with no spaces"
            });
            return;
        }

        let decoded: any;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET!); // decrypt the jwt token
        } catch(err) { // handle the case if token is expired
            console.error(err);
            res.status(400).json({
                success: false,
                message: "Verification Token Expired or Invalid"
            });
            return ;
        }
        const {email} = decoded; // destructure email from jwtPayload

        const hashedPassword = cache.get(email); // fetch hashedPassword from cache
        if(!hashedPassword) {
            res.status(400).json({
                success: false,
                message: "Verification Expired or Invalid",
            });
            return ;
        }
        
        try { // username is marked as unique field so this will handle the case where multiple users are trying a race for same username
            const newUser = await User.create({ // create new user
                email,
                password: hashedPassword, 
                username
            })
            cache.del(email); // delete the stored hashed password
            cache.del(`lock:${email}`); // delete lock from email after the account is created
    
            // after a successfull signIn keep the user logged in
            const accessToken = jwt.sign( // form access token
                { id: newUser._id, username: newUser.username, email, private_member: newUser.private_member },
                process.env.JWT_ACCESS_SECRET!,
                { expiresIn: "15m" }
            );
    
            res.cookie("accessToken", accessToken, { // send it into cookie
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 15 * 60 * 1000
            });
    
            const refreshToken = jwt.sign( // make a refresh token
                { id: newUser._id },
                process.env.JWT_REFRESH_SECRET!,
                { expiresIn: "7d" }
            );
    
            res.cookie("refreshToken", refreshToken, { // send it into cookie
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 7 * 24 * 60 * 60 * 1000
            });
    
            await RefreshToken.create({ // store it into databse
                token: refreshToken,
                userID: newUser._id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            });
        
            const userToSend = newUser.toObject() as any;
            delete userToSend.password;
            res.status(200).json({
                success: true,
                message: "User Registered Successfully",
                user: userToSend // send the created user body into response without it's stored password
            });
        } catch(err: any) {
            if(err.code === 11000) {
                if (err.keyPattern?.username) {
                    res.status(400).json({
                    success: false, 
                    message: "Username Already Taken"
                    });
                    return ;
                }
                else if(err.keyPattern?.email) {
                    res.status(400).json({
                        success: false,
                        message: "Email Already Registered"
                    }); 
                    return ;
                }
            }   
            res.status(400).json({
                success: false,
                message: "User creation failed due to unknown duplicate error"
            });
            return ;
        }
    } catch(err) {
        if (process.env.NODE_ENV !== "production") console.error("[SingUp Error:]",err);
        res.status(500).json({
            success: false,
            message: "Error While Creating Account",
        })
    }
}