const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Mount routers
app.use('/api/auth', require('./router/auth'));
app.use('/api/categories', require('./router/category'));
app.use('/api/products', require('./router/product'));

app.get('/', (req, res) => {
    res.send('API Quản lý Cafe đang chạy...');
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Server đang chạy ở chế độ ${process.env.NODE_ENV} trên cổng ${PORT}`);
});
