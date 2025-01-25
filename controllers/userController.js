const CustomError = require('./../Utils/CustomError');
const asyncErrorHandler = require('./../Utils/asyncErrorHandler');
const User = require('./../models/userSchema'); 
const authController = require("./authController")



exports.allUsers = asyncErrorHandler(async (req, res, next) => {
  
  const users = await User.find();
  if (!users) {
    return next(new CustomError('No users found', 404));
    }
    res.status(200).json({
    status: 'success',
    message: 'All users fetched successfully',
    users: users
  });
})

exports.userLoggedIn = asyncErrorHandler(async (req, res, next) => {
  
  const userId = req.user?.id;

  if (!userId) {
    return next(new CustomError('User not authenticated', 401));
  }
  const user = await User.findById(userId);

  if (!user) {
    return next(new CustomError('User not found', 404));
  }

    res.status(200).json({
    status: 'success',
    message: 'User fetched successfully',
    user
  });;
})




exports.getAllUsers = asyncErrorHandler( async( req, res, next) => {
  const users = await User.find()

  res.status(200).json({
    status: "success",
    result: users.length,
    data: {
      users
    }
  })
})

exports.updatePassword = asyncErrorHandler(async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return next(new CustomError("User not found", 404));
        }

        const compare = await user.comparePasswordInDb(req.body.currentPassword, user.password);
        if (!compare) {
            return next(new CustomError("The current password you provided is wrong", 401));
        }

        user.password = req.body.newPassword;
        user.confirmPassword = req.body.confirmPassword;

        await user.save();

        res.status(200).json({
            success: true,
            message: "Password updated successfully"
        });
    } catch (error) {
        next(error);
    }
});



function filterObj(obj, ...allowedFields) {
  const newObj = {};
  Object.keys(obj).forEach(key => { 
    if (allowedFields.includes(key)) {
      newObj[key] = obj[key]; 
    }
  });
  return newObj; 
}


exports.updateMe = asyncErrorHandler(async (req, res, next) => {
  
  if (req.body.password || req.body.confirmPassword) {
    return next(new CustomError('This route is not for password updates. Please use /updatePassword.', 400));
  }
 
  const filteredBody = filterObj(req.body, 'name', 'email');

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
}
)

exports.deleteMe = asyncErrorHandler( async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, {active: false} )
 

  res.status(204).json({
    status: "success",
    data: null
  })
})
