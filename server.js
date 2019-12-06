const dotenv = require('dotenv');

const mongoose = require('mongoose');

//This is for cahtching synchrous code even before anything runs. It must be here.
process.on('uncaughtException', err => {
  console.log('Uncaught exception! Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() =>
    console.log(`DB connection sucessful. Running in ${process.env.NODE_ENV}`)
  );

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

//Events and event listens. IF there is an unhandled rejection the process with emit an object called unhandled rejection
//This will handle any rejections that we have not accounted for
process.on('unhandledRejection', err => {
  console.log('Unhandled rejection! Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
