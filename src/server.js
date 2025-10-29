const express = require('express');
require('dotenv').config();
const { sequelize } = require('./models/index.js');
const booksRouter = require('./routes/books.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', booksRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Test database connection and start server
sequelize.authenticate()
  .then(() => {
    console.log('Database connection established successfully.');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
    process.exit(1);
  });

module.exports = app;