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
app.use(cookieParser());    
app.use("/api/v1", route);
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));


app.listen(PORT, ()=> {
    console.log(`App Started at Port: ${PORT}`);
});

connectWithDB();