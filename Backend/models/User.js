const mongoose = require('mongoose')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')

const UserSchema = new mongoose.Schema({
 username:{
    type:String,
    required:true,
    trim:true
 },
 email:{
   type:String,
   required:true,
   lowercase:true,
   unique:true,
   trim:true 
 },
 password:{
   type:String,
   required:true,
   minlength:6
 },
 profilePicture:{
   type:String,
   default:null
 }
} ,{
 timestamps:true
 })


 

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});


UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.generateToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email },
    process.env.JWT_SECRET,   
    { expiresIn: '30d' } 
  );
};

module.exports = mongoose.model("User",UserSchema)