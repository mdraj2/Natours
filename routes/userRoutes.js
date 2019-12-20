const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

//a special end point that does not follow the REST phil
router.get(
  '/me',
  authController.protect,
  userController.getMe,
  userController.getUser
);
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//We will use the middleware to protect routes after this point
router.use(authController.protect);
//All the below middleware will be called only if authenticed has been run
router.patch('/updateMyPassword', authController.updatePassword);
//photo is the name of the field
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe);
//Rest says that the action does not have anything to do with the URL

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
