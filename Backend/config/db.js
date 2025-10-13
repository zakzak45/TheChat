const mongoose  = require('mongoose')
const dotenv = require('dotenv').config()

const MONGODB_URL = process.env.MONGODB_URL;



const connectDB = async ()=>{
    try{
    const conn = await mongoose.connect(MONGODB_URL)
    console.log("MongoDb connected ")
    }catch(err){
   console.error(`Error ${err.message}`)
    }
}


module.exports = connectDB

