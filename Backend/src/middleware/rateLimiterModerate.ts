import rateLimit from "express-rate-limit";

export const rateLimiterModerate = rateLimit({
    windowMs: 60 * 1000, // 1 minute window
    max: 10, // limit each IP to 10 comments per minute
    message: {
        success: false,
        message: "Too many requests, Please slow down"
    },
    standardHeaders: true,
    legacyHeaders: false,
});