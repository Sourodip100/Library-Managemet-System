require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Book = require('../models/Book');

const seedData = async () => {
  try {
    await connectDB();

    const adminExists = await User.findOne({ email: 'admin@library.com' });
    if (!adminExists) {
      await User.create({
        name: 'Library Admin',
        email: 'admin@library.com',
        password: 'Admin@123',
        role: 'admin',
      });
      console.log('Admin user created: admin@library.com / Admin@123');
    } else {
      console.log('Admin user already exists, skipping.');
    }

    const bookCount = await Book.countDocuments();
    if (bookCount === 0) {
      await Book.insertMany([
        {
          title: 'Clean Code',
          author: 'Robert C. Martin',
          isbn: '9780132350884',
          category: 'Software Engineering',
          description: 'A handbook of agile software craftsmanship.',
          publishedYear: 2008,
          publisher: 'Prentice Hall',
          totalCopies: 5,
          availableCopies: 5,
        },
        {
          title: 'Kubernetes Up & Running',
          author: 'Kelsey Hightower',
          isbn: '9781492046530',
          category: 'DevOps',
          description: 'Dive into the future of infrastructure.',
          publishedYear: 2019,
          publisher: "O'Reilly Media",
          totalCopies: 3,
          availableCopies: 3,
        },
        {
          title: 'The Pragmatic Programmer',
          author: 'Andrew Hunt',
          isbn: '9780135957059',
          category: 'Software Engineering',
          description: 'Your journey to mastery.',
          publishedYear: 2019,
          publisher: 'Addison-Wesley',
          totalCopies: 4,
          availableCopies: 4,
        },
      ]);
      console.log('Sample books seeded.');
    } else {
      console.log('Books already exist, skipping.');
    }

    console.log('Seeding complete.');
    process.exit(0);
  } catch (error) {
    console.error(`Seed error: ${error.message}`);
    process.exit(1);
  }
};

seedData();
