const mongoose  = require('mongoose')
const dotenv = require('dotenv').config()

const MONGODB_URL = process.env.MONGODB_URL;



const connectDB = async ()=>{
    try{
    const conn = await mongoose.connect(MONGODB_URL)
    console.log("✅ MongoDB connected successfully")
    console.log(`   Database: ${conn.connection.host}`)
    }catch(err){
   console.error(`❌ MongoDB connection error: ${err.message}`)
   process.exit(1); // Exit process with failure
    }
}


module.exports = connectDB

