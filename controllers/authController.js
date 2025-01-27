const User = require("./../models/userSchema")
const asyncErrorHandler = require("./../Utils/asyncErrorHandler")
const util = require("util")
const crypto = require('crypto')
const jwt = require("jsonwebtoken")
const CustomError = require("./../Utils/CustomError")
const sendForgotPasswordEmail = require("./../Utils/sendForgotPasswordEmail") 
const bcrypt = require("bcryptjs");
const validator = require("validator");


const signToken = id => {
    
if (!process.env.SECRET_STR) {
    throw new Error('Missing SECRET_STR in environment variables');
}
    const secret = process.env.SECRET_STR; 
    return jwt.sign({ id: id }, secret, {
        expiresIn: process.env.LOGIN_EXPIRES || '1h', // Add default expiry
    });
};


function getMaxAge() {
    const maxAge = parseInt(process.env.LOGIN_EXPIRES, 10);
    if (isNaN(maxAge)) {
      throw new Error('LOGIN_EXPIRES environment variable is not a valid number');
    }
    return maxAge;
  }

  const createSendResponse = (user, statusCode, res) => {
    try {
        const token = signToken(user._id);
        const maxAge = getMaxAge();
        const options = {
            maxAge: maxAge,
            httpOnly: true,
        };

        if (process.env.NODE_ENV === 'production') {
            options.secure = true;
        }

        console.log('Someone Just logged in');
        res.cookie('authToken', token, options);

        user.password = undefined;

        res.status(statusCode).json({
            status: 'success',
            data: { user },
        });
    } catch (err) {
        console.error('Token creation failed:', err.message);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error during token creation',
        });
    }
};


exports.signup = asyncErrorHandler(async (req, res, next) => {
    try {
        if (!req.body.username || !req.body.email || !req.body.password || !req.body.phoneNumber || !req.body.country) {
            return next(new CustomError("Username, email, and password are required", 400));
        }
        
        const { username, email, password, phoneNumber, country } = req.body;
      
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return next(new CustomError("Email is already in use", 409));
        }
        const hashedPassword = await bcrypt.hash(password, 10);
      
        if (!validator.isEmail(email)) {
            return next(new CustomError("Invalid email address", 400));
        }
        if (!validator.isMobilePhone(phoneNumber)) {
            return next(new CustomError("Invalid phone number", 400));
        }
        if (!country || typeof country !== "string" || country.trim().length === 0) {
            return next(new CustomError("Invalid country", 400));
        }
        const user = await User.create({
                                        username, 
                                        email,
                                        password: hashedPassword,
                                        phoneNumber,
                                        country,
                                        date:  `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` });

        
        createSendResponse(user, 201, res); // Ensure this function is properly implemented
    } catch (error) {
        console.error("Error during signup:", error);
        return next(new CustomError("Signup failed", 500));
    }
});

exports.login =  asyncErrorHandler(async (req, res, next) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return next(new CustomError("Provide your username and password", 401))
    }
    if (!validator.isAlphanumeric(username)) {
        return next(new CustomError("Invalid username format", 400));
      }
   
    const user = await User.findOne({username}).select('+password')
    const compare = await user.comparePasswordInDb(password, user.password)

if(!user || !compare) {
    const error = new CustomError("Incorrect username or password", 400)
    return next(error)
}
console.log("Someone Just logged in")
createSendResponse(user, 200, res)
})

exports.protect = asyncErrorHandler(async (req, res, next) => {
   
    const testToken = req.headers.authorization
    let token;
    if (testToken && testToken.startsWith("Bearer")) {
        token = testToken.split(" ")[1] 
      
    }
    console.log(token)
    
    if (!token) {
      return  next(new CustomError("You are not logged in", 401))
    }

     let decodedToken 
     try {
        const verifyToken = util.promisify(jwt.verify);
        decodedToken = await verifyToken(token, process.env.SECRET_STR);
        console.log('Decoded Token:', decodedToken);
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
     
    
    let user 
    
    try {
        user = await User.findById(decodedToken.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        console.log('User:', user);
    } catch (err) {
        return res.status(500).json({ message: 'Error fetching user', error: err.message });
    }
    if (!user) {
      return next(new CustomError("The user with the token does not exist", 401))
    }  
    
    const isPasswordChanged =  user.isPasswordChanged(decodedToken.iat)  
    if (isPasswordChanged) {
      return next(new CustomError("User has changed his password. Please log in again", 401))
      } 
    req.user = user;
    next()
    
    })

    exports.restrict = (role) => {
        return (req, res, next) => {
            if (req.user.role !== role) {       
                return next(new CustomError("You do not have permission to perform this action", 403))
            }
            next()
        }
    }

    exports.forgotPassword = asyncErrorHandler(async (req, res, next) => {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return next(new CustomError("There is no user with this email address", 404));
        }
    
        const resetToken = user.createResetPasswordToken();
        await user.save({ validateBeforeSave: false });
    
        const resetUrl = `${req.protocol}://${req.get("host")}/api/v1/auth/resetPassword/${resetToken}`;
    
        try {
            // Send the password reset email
            await sendForgotPasswordEmail(user.email, resetUrl);
    
            res.status(200).json({
                status: "success",
                message: "Password reset link sent to the user's email",
            });
        } catch (err) {
            // Reset token fields in case of an email failure
            user.passwordResetToken = undefined;
            user.passwordResetTokenExpires = undefined;
            await user.save({ validateBeforeSave: false });
    
            console.log(err);
            return next(
                new CustomError("There was an error sending the email. Try again later", 500)
            );
        }
    });
    

    exports.resetPassword = asyncErrorHandler(async(req, res, next) => {   
        const token = crypto.createHash("sha256").update(req.params.token).digest("hex");
     const user = await User.findOne({passwordResetToken: token, passwordResetTokenExpires: {$gt: Date.now()}}) 
       if (!user) {
           return next(new CustomError("Token is invalid or has expired", 400));
       }
        user.password = req.body.password;
        user.confirmPassword = req.body.confirmPassword;
        user.passwordResetToken = undefined;
        user.passwordResetTokenExpires = undefined;
        user.passwordChangedAt = Date.now();
            
        await user.save(); 
        createSendResponse(user, 200, res)
        
    
    })



    exports.authStatus = async (req, res, next) => {
        try {
          const token = req.cookies?.authToken; 
          if (!token) {
            return res.status(401).json({
              isAuthenticated: false,
              message: 'No authentication token provided',
            });
          }
      
          let decoded;
          try {
            // Verify the token
            decoded = jwt.verify(token, process.env.JWT_SECRET);
          } catch (err) {
            console.error('Token verification failed:', err.message);
            return res.status(401).json({
              isAuthenticated: false,
              message: 'Invalid or expired authentication token',
            });
          }
      
          // Respond with authenticated status
          return res.status(200).json({
            isAuthenticated: true,
            username: decoded.username,
            cookie: token,
          });
        } catch (error) {
          console.error('Unexpected error in authStatus handler:', error.message);
          return res.status(500).json({
            isAuthenticated: false,
            message: 'Internal server error',
          });
        }
      };
      

