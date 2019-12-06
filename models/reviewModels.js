//review /rating /createdAt/ ref to tour/ ref to user
const mongoose = require('mongoose');
const Tour = require('./tourModels');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

reviewSchema.pre(/^find/, function(next) {
  /*   this.populate({
    path: 'tour',
    select: 'name'
  }).populate({
    path: 'user',
    select: 'name photo'
  }); */

  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});

reviewSchema.statics.calAverageRatings = async function(tourId) {
  //aggregate works on the model.
  //first stage is matching all the reviews that match the tourId
  //We group by Id and show the following fields
  //we will add 1 for each match
  //we want to calculate the average from the rating
  console.log('here');
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  console.log(stats);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].nRating,
      ratingsQuantity: stats[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 0,
      ratingsQuantity: 4.5
    });
  }
};

//this ensures that the tour and user together are unique
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

//use post because collection is not really in model just yet
//post does not get access to next
reviewSchema.post('save', function() {
  //this points to current review but we need to go to the model not to the
  //instance. So we go to the constructor of the instance which is the Reviews Models
  //we do with by accessing the constructor of the this keyword
  this.constructor.calAverageRatings(this.tour);
});

//we dont have document middleware only query middleware
//this is mongodb implementaiton. It will work on findoneandupdate and findoneanddelete
reviewSchema.pre(/^findOneAnd/, async function(next) {
  //this keyword is a query in here. We will get the model by executing the model
  //still not updated
  this.r = await this.findOne();
  console.log(this.r);
  next();
});

reviewSchema.post(/^findOneAnd/, async function(next) {
  await this.r.constructor.calAverageRatings(this.r.tour);
});

const Review = mongoose.model('Reviews', reviewSchema);

module.exports = Review;
