const asyncHandler = require('express-async-handler');
const Book = require('../models/Book');

// @desc    Get all books (supports search & pagination)
// @route   GET /api/books?keyword=&category=&page=&limit=
// @access  Public
const getBooks = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 12;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.keyword) {
    filter.$text = { $search: req.query.keyword };
  }
  if (req.query.category) {
    filter.category = req.query.category;
  }

  const [books, total] = await Promise.all([
    Book.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Book.countDocuments(filter),
  ]);

  res.json({
    success: true,
    count: books.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: books,
  });
});

// @desc    Get single book
// @route   GET /api/books/:id
// @access  Public
const getBookById = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }
  res.json({ success: true, data: book });
});

// @desc    Create a book
// @route   POST /api/books
// @access  Private/Admin/Librarian
const createBook = asyncHandler(async (req, res) => {
  const {
    title,
    author,
    isbn,
    category,
    description,
    publishedYear,
    publisher,
    coverImage,
    totalCopies,
  } = req.body;

  const book = await Book.create({
    title,
    author,
    isbn,
    category,
    description,
    publishedYear,
    publisher,
    coverImage,
    totalCopies: totalCopies || 1,
    availableCopies: totalCopies || 1,
  });

  res.status(201).json({ success: true, data: book });
});

// @desc    Update a book
// @route   PUT /api/books/:id
// @access  Private/Admin/Librarian
const updateBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }

  const { totalCopies } = req.body;
  if (totalCopies !== undefined) {
    // adjust availableCopies proportionally when total changes
    const diff = totalCopies - book.totalCopies;
    book.availableCopies = Math.max(0, book.availableCopies + diff);
    book.totalCopies = totalCopies;
  }

  const fields = [
    'title',
    'author',
    'isbn',
    'category',
    'description',
    'publishedYear',
    'publisher',
    'coverImage',
  ];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) book[field] = req.body[field];
  });

  await book.save();
  res.json({ success: true, data: book });
});

// @desc    Delete a book
// @route   DELETE /api/books/:id
// @access  Private/Admin
const deleteBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }
  await book.deleteOne();
  res.json({ success: true, message: 'Book removed' });
});

// @desc    Get distinct categories
// @route   GET /api/books/categories/all
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Book.distinct('category');
  res.json({ success: true, data: categories });
});

module.exports = {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getCategories,
};
