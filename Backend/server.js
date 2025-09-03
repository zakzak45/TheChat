const express = require('express')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const ChatMessage = require('./models/Chat.js')
const cors = require('cors')
const authRoutes = require('./Routes/AuthRoute.js')


dotenv.config()
const app = express()
app.use(cors())
app.use(express.json())
PORT  = 3000

mongoose.connect('mongodb+srv://zayne:khunjuliwe@cluster0.wuri8yj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0').then(()=>{
    console.log('connected to database')
}).catch((err)=>{
    console.log("something happened "+err)
})

app.use('/messages',authRoutes)

app.get('/messages',async (req,res)=>{
    try{
     const messages = await ChatMessage.find()
     res.json(messages)
    }catch(err){
     console.log("something went wrong "+ err)
    }
})

app.post('/messages', async(req,res)=>{
    try{
    const {user,message} = req.body


	if (!user || !message) {
			return res
				.status(400)
				.json({ error: "User and message are required" });
	}

    const Chat = new ChatMessage({
			user,
			message,
	});
    await Chat.save();
    }catch(err){
        console.error(err);
		res.status(500).json({ error: "Internal Server Error" }); 
    }


})



app.listen(PORT,()=>{
    console.log(`server running in http://localhost:${PORT}`)
})



