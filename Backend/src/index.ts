import express from "express";
import route from "./route/VSenior.ts";
import connectWithDB from "./config/database.ts";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
dotenv.config();

const PORT = process.env.PORT || 5000;

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(cookieParser());    
app.use("/api/v1", route);


app.listen(PORT, ()=> {
    console.log(`App Started at Port: ${PORT}`);
});

connectWithDB();