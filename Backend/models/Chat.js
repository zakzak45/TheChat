const mongoose = require('mongoose')

const ChatMessagesSchema= new  mongoose.Schema({
     user:{type:String,required:true},
     message:{type:String , required:true},
     timestamps:{ type:Date, default:Date.now}
})

const Chat = mongoose.model("messages",ChatMessagesSchema)

module.exports = Chat
