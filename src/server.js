const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./config/logger');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
