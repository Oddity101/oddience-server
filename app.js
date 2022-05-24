const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const mentorRoutes = require('./routes/mentorRoutes');
const errors = require('./middlewares/errors');
const cookieParser = require('cookie-parser');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

app.use('/api/v1', authRoutes);
app.use('/api/v1', mentorRoutes);

app.use(errors);
module.exports = app;
