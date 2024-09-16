// models/Order.js

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerName: String,
  email: String,
  address: String,
  products: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: Number,
      price: Number,
    },
  ],
  totalPrice: Number,
  date: { type: Date, default: Date.now },
  orderStatus: { type: String, default: 'Pending' },
});

module.exports = mongoose.model('Order', orderSchema);