const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/userModels');
const catchAsync = require('./../utils/catchAsync.js');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

/* const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img/users');
  },
  filename: (req, file, cb) => {
    //user-id-date-extention ensure that no file is duplicationed
    const ext = file.mimetype.split('/')[1];
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  }
}); */

const multerStorage = multer.memoryStorage();

//test if the uploaded file is an image
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Plase upload only images.', 404), false);
  }
};
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadUserPhoto = upload.single('photo');

//file upload middleware
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

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
  if (req.file) filteredBody.photo = req.file.filename;
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
