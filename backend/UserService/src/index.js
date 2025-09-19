require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const userRouter = require('./Routers/user.router');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('User Service connected to MongoDB'))
  .catch(err => console.error('DB connection error:', err));

// Routes
app.use('/api/users', userRouter);

app.listen(PORT, () => {
  console.log(`User Service listening on port ${PORT}`);
});