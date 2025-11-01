const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const logger = require('./config/logger');

const app = express();

app.use(helmet());
const allowedOrigins = [
  "https://e-govinfo-app--jcsnz545t6.expo.app",
  "http://localhost:8081",
  "http://localhost:3000",
  "http://localhost:5000",
];

app.set("trust proxy", 1); // trust first proxy

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
// Global rate limiter removed; handled per-route in middlewares/rateLimiter.js

// Route registration
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/announcements', require('./routes/announcement.routes'));
app.use('/api/feedback', require('./routes/feedback.routes'));
app.use('/api/polls', require('./routes/poll.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

app.get('/', (req, res) => {
	res.send('GovInfo backend API is running');
});

module.exports = app;
