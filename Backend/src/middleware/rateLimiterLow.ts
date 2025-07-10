import rateLimit from "express-rate-limit";

export const rateLimiterLow = rateLimit({
    windowMs: 60 * 1000, // 1 minute window
    max: 5, // limit each IP to 5 comments per minute
    message: {
        success: false,
        message: "Too many requests, Please slow down"
    },
    standardHeaders: true,
    legacyHeaders: false,
});