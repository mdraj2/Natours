const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// name, email, photo( string), passwordm passwordConfirm and make a model and export it

const Userschema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'please tell us your name']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      //This only works on CREATE and SAVE!!! You can use SAVE to update the user
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

Userschema.pre('save', async function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  //saving takes time because changedPasswordAfter method will not work properly as saving to db takes time.
  // we cast 1sec back
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//between getting and saving the data this middleware will run
Userschema.pre('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();
  //Hash the passwrod with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  //Delete passwordConfirm delete
  this.passwordConfirm = undefined;
  //You dont need to call next if you have a promise returned
  next();
});

Userschema.pre(/^find/, function(next) {
  //this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

Userschema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

Userschema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changeTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    console.log(changeTimestamp, JWTTimestamp);
    return JWTTimestamp < changeTimestamp;
  }
  return false;
};

Userschema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', Userschema);

module.exports = User;
