import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
dotenv.config();

// using sendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

// send verification email to the user 
export const sendVerificationEmail = async(to: string, token: string)=> {
    const link = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
    const msg = {
        from: {
            name: "VSenior",
            email: process.env.EMAIL_FROM!
        },
        to,
        subject: "Verify Your Email",
        html: 
        `<div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
            <div style="background-color: #4f46e5; padding: 20px; color: white; text-align: center;">
                <h2 style="margin: 0;">Welcome to VSenior</h2>
            </div>
            <div style="padding: 30px; text-align: left;">
                <h3 style="color: #333333;">Verify Your Email Address</h3>
                <p style="font-size: 16px; color: #555555;">
                Hello, <br/>
                Thank you for registering with <strong>VSenior</strong>. To complete your sign-up, please verify your email by clicking the button below:
                </p>
                <div style="text-align: center; margin: 30px 0;">
                <a href="${link}" target="_blank" style="background-color: #4f46e5; color: white; padding: 14px 24px; border-radius: 6px; text-decoration: none; font-size: 16px; display: inline-block;">
                    Verify Email
                </a>
                </div>
                <p style="font-size: 14px; color: #888888;">
                If the button above does not work, you can also verify by clicking the link below:
                </p>
                <p style="word-break: break-all; font-size: 14px; color: #4f46e5;">
                <a href="${link}" target="_blank" style="color: #4f46e5;">${link}</a>
                </p>
                <p style="font-size: 14px; color: #888888;">
                This link will expire in <strong>10 minutes</strong> for security reasons.
                </p>
                <hr style="margin-top: 30px; border: none; border-top: 1px solid #eeeeee;" />
                <p style="font-size: 12px; color: #aaaaaa; text-align: center;">
                If you didn’t create an account, please ignore this email or contact support.
                </p>
            </div>
            </div>
        </div>`
    };

    try {
        await sgMail.send(msg); 
    } catch(err) {
        console.error(err);
        throw new Error("Failed to send Verification Email");
    }
}