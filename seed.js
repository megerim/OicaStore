// seed.js
const mongoose = require('mongoose');
const Product = require('./models/Product');

mongoose.connect('mongodb+srv://merimgokhan:9fGJyRN9npdvUq5Z@rica.giqgv.mongodb.net/?retryWrites=true&w=majority&appName=rica');

const products = [
  {
    name: 'Extra Virgin Olive Oil',
    price: 20,
    description: 'High-quality extra virgin olive oil.',
    image: 'olive1.webp',
  },
  {
    name: 'Organic Olive Oil',
    price: 25,
    description: 'Certified organic olive oil.',
    image: 'olive2.jpeg',
  },
  {
    name: 'Flavored Olive Oil',
    price: 22,
    description: 'Olive oil infused with herbs and spices.',
    image: 'olive3.jpeg',
  },
];

async function seedDB() {
  try {
    await Product.deleteMany({});
    await Product.insertMany(products);
    console.log('Database seeded with products.');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seedDB();
