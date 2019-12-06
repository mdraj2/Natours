const mongoose = require('mongoose');
const slugify = require('slugify');
//const validator = require('validator');
//const User = require('./userModels');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      minlength: [10, 'A tour name must have more or equal than 10 Characters'],
      maxlength: [40, 'A tour name must have less or equal than 40 Characters']
    },

    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },

    slug: String,

    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Allowed are : easy, medium or difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'rating must be below 5.0'],
      set: val => Math.round(val * 10) / 10 //4.66666, 46.66/ 47/ 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        message: 'Discount price should be less than price',
        //does not work with updating document however
        validator: function(val) {
          return val < this.price;
        }
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
//2d sphere index that describe the data on a earths surface
tourSchema.index({ startLocation: '2dsphere' });

//These are calculate properties (but cannot be queried)
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

tourSchema.virtual('reviews', {
  ref: 'Reviews',
  foreignField: 'tour',
  localField: '_id'
});

//DOCUMENT MIDDLEWARE: runs before .save() and .create() but not on .insertMany
//this will point to the document that will be saved
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

/* tourSchema.pre('save', async function(next) {
  const guidesPromises = this.guides.map(async id => await User.findById(id));
  this.guides = await Promise.all(guidesPromises);
  next();
}); */

//You can have mutiple presave or post save middlewares

/* tourSchema.post('save', function(doc, next) {
  console.log(doc);
  next();
}); */

//QUERY MIDDLEWARE: runs before .find() and the different find methods using a regular expression
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt -email'
  });
  next();
});

tourSchema.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  next();
});

//AGGREGATION MIDDLEWARE (LEARN MORE ABOUT PRE and POST)
/* tourSchema.pre('aggregate', function(next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
}); */

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
