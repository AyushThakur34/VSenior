import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const connectWithDB = ()=> {
    const dbUrl = process.env.DATABASE_URL;
    if(!dbUrl) {
        console.error("Database Url not present");
        process.exit(1);
    }

    mongoose.connect(dbUrl)
    .then(()=> {console.log("Connection With Database Established Successfully")})
    .catch((err)=> {
        console.error(err);
        console.log("Failed to Connect With Database");
        process.exit(1);
    })
}

export default connectWithDB;