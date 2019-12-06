const User = require('./../models/userModels');
const catchAsync = require('./../utils/catchAsync.js');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  //get all the keys check if the key exists in the allowed fields. If so assign value of old obj to new object otherwise continue
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i += 1) {
    if (allowedFields.includes(keys[i])) newObj[keys[i]] = obj[keys[i]];
  }
  return newObj;
};

exports.getMe = (req, res, next) => {
  //user.id is made when passing through the protect middleware
  req.params.id = req.user.id;
  next();
};

//note that data and password updates are seperated into two  different places
exports.updateMe = catchAsync(async (req, res, next) => {
  //1) Create error if user POSTS password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword',
        400
      )
    );
  }
  //2) Update user document
  //canot use save because it requires the password field aswell
  //we want to fileter the data to name and email
  const filteredBody = filterObj(req.body, 'name', 'email');
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });
  res.status(200).json({
    status: 'success',
    data: { user: updatedUser }
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined. Please use /signup instead'
  });
};

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'sucess',
    data: null
  });
});

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
//Do not update password with this
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
