import rateLimit from "express-rate-limit";

export const SignupRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute window
    max: 5, // limit each IP to 5 comments per minute
    message: {
        success: false,
        message: "Too many comments, Please slow down"
    },
    standardHeaders: true,
    legacyHeaders: false,
});