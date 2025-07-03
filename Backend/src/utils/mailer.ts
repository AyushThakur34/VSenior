import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
dotenv.config();

// using sendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

// send verification email to the user 
export const sendVerificationEmail = async(to: string, token: string)=> {
    const link = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
    const msg = {
        from: `"VSenior <${process.env.EMAIL_USER}>"`,
        to,
        subject: "Verify Your Email",
        html:   `
            <h3>Welcome to CS Resources!</h3>
            <p>Click the link below to verify your email:</p>
            <a href="${link}">${link}</a>
            <p>This link expires in 10 minutes.</p>
                `
    };

    await sgMail.send(msg);
}