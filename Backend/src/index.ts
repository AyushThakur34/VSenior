import express from "express";
import route from "./route/VSenior";
import connectWithDB from "./config/database";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 4000;

const app = express();
app.use(express.json());
app.use("/api/v1", route);

app.listen(PORT, ()=> {
    console.log(`App Started at Port: ${PORT}`);
});

connectWithDB();