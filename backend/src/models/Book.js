const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
    },
    isbn: {
      type: String,
      required: [true, 'ISBN is required'],
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      default: 'General',
    },
    description: {
      type: String,
      default: '',
    },
    publishedYear: {
      type: Number,
    },
    publisher: {
      type: String,
      default: '',
    },
    coverImage: {
      type: String,
      default: '',
    },
    totalCopies: {
      type: Number,
      required: true,
      default: 1,
      min: 0,
    },
    availableCopies: {
      type: Number,
      required: true,
      default: 1,
      min: 0,
    },
  },
  { timestamps: true }
);

bookSchema.index({ title: 'text', author: 'text', category: 'text' });

module.exports = mongoose.model('Book', bookSchema);
