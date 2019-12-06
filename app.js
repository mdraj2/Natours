const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError.js');
const globalErrorhandler = require('./controllers/errorController.js');
const tourRouter = require('./routes/tourRoutes.js');
const userRouter = require('./routes/userRoutes.js');
const reviewsRouter = require('./routes/reviewRoutes.js');
const viewRouter = require('./routes/viewRoutes.js');

const app = express();

app.set('view engine', 'pug');
//ensures that this will run with the path of where app.js is located
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
//1)Middlewares
//Set security HTTP headers
app.use(helmet());
/*All these middleware will be applied for all paths in the order defined*/
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'To many requirests from this IP. Please try again in an hour'
});
app.use('/api', limiter);
/* To parse JSON strings */
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
/* If any paths match this route we will send static pages */

//filters out all the dollar signs and dots
app.use(mongoSanitize());

//html code and javascript code removed
app.use(xss());

//Prevent parameter polution.
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

app.use((res, req, next) => {
  console.log('Hello from the middleware');
  next();
});
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.cookies);
  next();
});

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewsRouter);

app.all('*', (req, res, next) => {
  //anything that is passed into next is an err. All other middleware will be skipped
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorhandler);

module.exports = app;

//4 Start Server
