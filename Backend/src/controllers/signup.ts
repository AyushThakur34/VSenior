import User from "../models/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";
import { sendVerificationEmail } from "../utils/mailer";
import isStrongPassword from "../utils/checkStrongPassword";
import cache from '../utils/cache';
import RefreshToken from "../models/RefreshToken";
import dotenv from "dotenv";
dotenv.config();

// takes email and password as req
// verifies email and password format
// check for existing email
// encrypts the password and store it into cache
// verifiy user email by sending verification code
export const signup = async(req: any, res: any)=> {
    try {
        const { email, password } = req.body;

        if(!validator.isEmail(email)) { // validate email format
            return res.status(400).json({
                success: false,
                message: "Invalid Email Format"
            });
        }

        const existingUser = await User.findOne({email}); 
        if(existingUser) { // handle the case for already registered email
            return res.status(400).json({
                success: false,
                message: "Email Already Registered"
            });
        }

        const emailReserved = cache.get(`lock:${email}`); // handle the case if multiple users are trying to signin with same email address
        if(emailReserved) {
            return res.status(400).json({
                success: false,
                message: "Email is Already in Verification Process"
            });
        }

        cache.set(`lock:${email}`, true, 600); // lock the email in cache before verifying it

        if(!isStrongPassword(password)) { // validate password format
            return res.status(400).json({
                success: false,
                message: "Password must contain one uppercase, one lowercase, one digit, one special character and must be atleast 8 characters long"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10); // encrypt the password

        cache.set(email, hashedPassword, 600); // store hashedPassword into cache

        const emailToken = jwt.sign({email}, process.env.JWT_SECRET!, {expiresIn: "10m"}); // sign emailToken

        try {
            await sendVerificationEmail(email, emailToken); // send verification email
        } catch(err) {
            cache.del(`lock:${email}`);
            console.error(err);
            return res.status(400).json({
                success: false,
                message: "Failed to Send Verification Email"
            });
        }
        
        res.status(200).json({
            success: true,
            message: "Email Verification Link Sent Successfully",
        });
    } catch(err) {
        console.error("[Registration Error:]",err);
        res.status(500).json({
            success: false,
            message: "Error While Registering Email",
            error: err
        });
    }
};

// creates account after verifying user_email and username
export const createAccount = async(req: any, res: any)=> {
    try {
        const { token, username } = req.body;
        if(!token || !username) { // handle the case if token or username is missing from req body
            return res.status(400).json({
                success: false,
                message: "Token and Username are Required"
            });
        }

        let decoded: any;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET!); // decrypt the jwt token
        } catch(err) { // handle the case if token is expired
            console.error(err);
            return res.status(400).json({
                success: false,
                message: "Token Expired"
            });
        }
        const {email} = decoded; // destructure email from jwtPayload

        const hashedPassword = cache.get(email); // fetch hashedPassword from cache
        if(!hashedPassword) {
            return res.status(400).json({
                success: false,
                message: "Verification Expired or Invalid",
            });
        }
        cache.del(email); // delete from cache
        
        try { // username is marked as unique field so this will handle the case where multiple users are trying a race for same username
            const newUser = await User.create({ // create new user
                email: email,
                password: hashedPassword, 
                username: username
            })
            cache.del(`lock:${email}`); // delete lock from email after the account is created
    
            // after a successfull signIn keep the user logged in
            const accessToken = jwt.sign( // form access token
                { id: newUser._id, username: newUser.username, email },
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
    
            const userResponse = newUser.toObject();
            delete userResponse.password;
        
            res.status(200).json({
                success: true,
                message: "User Registered Successfully",
                user: userResponse // send the created user body into response without it's stored password
            });
        } catch(err: any) {
            if(err.code === 11000) {
                if (err.keyPattern?.username) {
                    return res.status(400).json({
                    success: false,
                    message: "Username Already Taken"
                    });
                }
                else if(err.keyPattern?.email) {
                    return res.status(400).json({
                        sucess: false,
                        message: "Email Already Registered"
                    }); 
                }
            }
        }
    } catch(err) {
        console.error("[SingUp Error:]",err);
        res.status(500).json({
            success: false,
            message: "Error While Creating Account",
            error: err
        })
    }
}