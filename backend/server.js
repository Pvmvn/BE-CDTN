const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const startOrderWatcher = require('./config/orderWatcher');
const startReservationWatcher = require('./config/reservationWatcher');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use('/api/auth', require('./router/authRouter'));
app.use('/api/users', require('./router/userRouter'));
app.use('/api/categories', require('./router/categoryRouter'));
app.use('/api/products', require('./router/productRouter'));
app.use('/api/carts', require('./router/cartRouter'));
app.use('/api/orders', require('./router/orderRouter'));
app.use('/api/payments', require('./router/paymentRouter'));
app.use('/api/reservations', require('./router/reservationRouter'));
app.use('/api/vouchers', require('./router/voucherRouter'));
app.use('/api/contacts', require('./router/contactRouter'));
app.use('/api/blogs', require('./router/blogRouter'));
app.use('/api/ingredients', require('./router/ingredientRouter'));
app.use('/api/recipes', require('./router/recipeRouter'));

app.get('/', (req, res) => {
    res.send('Cafe management API is running');
});

const PORT = process.env.PORT || 8080;

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
            startOrderWatcher();
            startReservationWatcher();
        });
    } catch (error) {
        console.error(`Failed to start server: ${error.message}`);
        process.exit(1);
    }
};

startServer();
