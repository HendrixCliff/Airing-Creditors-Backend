const mongoose = require('mongoose');
const bcrypt = require( "bcryptjs")
const validator = require( "validator")
const crypto = require( "crypto")

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  email: {
    type: String,
    required: [true, "Please enter an email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please enter a valid email"],
  },
  phoneNumber: {
    type: String,
    required: [true, "Please enter a phone number"],
  },
  country: {
    type: String,
required: [true, "Please enter a country"],
  },
  date: {
    type: Date, 
   required: true, 
 },
  photo: String,
role: {
    type: String,
    enum: ["user", "admin"], 
    default: "user", 
    select: false
},
  password: {
    type: String,
    minlength: 5,
    required: [true, "Password is required please provide one for yourself"],
   select: false
},
  confirmPassword: {
    type: String,
    minlength: 5,
    required: [true, "Please provide a confirmation to your password"],
    validate: {
        validator: function(val) {
          return  val === this.password;
        },
       
        message: "Password and confirmPassword do not match"
    }  
},
active : {
    type: Boolean,
    select: false,
    default: true
},
passwordChangedAt: {
    type: Date,
    select: false
},

passwordResetToken: {
  type: String,
  select: false
},
passwordResetTokenExpires: {
  type: String,
  select: false
}

});
userSchema.pre("save", async function(next) {
    if(!this.isModified('password')) return next()

       
        this.password = await bcrypt.hash(this.password, 12)  //async version
        this.confirmPassword = undefined;
        next()
       

    })  
userSchema.pre(/^find/, function(next) {
     this.find({active: {$ne: false}})
     
     next()
 })

userSchema.methods.comparePasswordInDb = async function(pswd, pswdDb) {
    return await bcrypt.compare(pswd, pswdDb)
 }
 userSchema.methods.isPasswordChanged = function(JWTTimestamp) {
    if (this.passwordChangedAt) {                                                           //base10
        const passwordChangedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);   //Changing from miliseconds to seconds
        console.log(passwordChangedTimestamp, JWTTimestamp)
        return JWTTimestamp < passwordChangedTimestamp
    }


    return false         
}
userSchema.methods.createResetPasswordToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex'); 
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;
    console.log({ resetToken }, this.passwordResetToken);
    return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
