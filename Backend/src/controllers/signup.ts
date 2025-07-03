import User from "../models/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";
import { sendVerificationEmail } from "../utils/mailer";
import isStrongPassword from "../utils/checkStrongPassword";
import cache from '../utils/cache';
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
        if(existingUser) { // check for existing email in the database
            return res.status(400).json({
                success: false, 
                message: "Email Already Registered"
            });
        }

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
        if(!token || !username) {
            return res.status(400).json({
                success: false,
                message: "Token and Username are Required"
            });
        }

        const existingUser = await User.findOne({username}); 
        if(existingUser) { // check for existing username in database
            return res.status(400).json({
                success: false,
                message: "Username Already Taken"
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

        const hashedPassword = cache.get("email"); // fetch hashedPassword from cache
        if(!hashedPassword) {
            return res.status(400).json({
                success: false,
                message: "Verification Expired or Invalid"
            });
        }
        cache.del(email); // delete from cache
    
        const newUser = await User.create({ // create new user
            email: email,
            password: hashedPassword, 
            username: username
        })

        const userResponse = newUser.toObject();
        delete userResponse.password;
    
        res.status(200).json({
            success: true,
            message: "User Registered Successfully",
            user: userResponse // send the created user body into response without it's stored password
        });
    } catch(err) {
        console.error("[SingUp Error:]",err);
        res.status(500).json({
            success: false,
            message: "Error While Creating Account",
            error: err
        })
    }
}