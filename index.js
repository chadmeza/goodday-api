require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const cors = require('cors');

const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const dbHelper = require('./utils/dbHelper');
const errorHandler = require('./middleware/errorHandler');

dbHelper.connectToDB();

const app = express();

app.use(express.json());
app.use(cookieParser());

// protect against MongoDB operator injections
app.use(mongoSanitize());

// add HTTP headers for security
app.use(helmet());

// protect against XSS attacks
app.use(xss());

// enable CORS
app.use(cors());

app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/auth', authRoutes);

app.use(errorHandler);

const port = process.env.PORT || 3000;
const server = app.listen(port);

module.exports = server;