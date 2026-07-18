const asyncHandler = require('express-async-handler');
const Transaction = require('../models/Transaction');
const Book = require('../models/Book');

const LOAN_PERIOD_DAYS = parseInt(process.env.LOAN_PERIOD_DAYS, 10) || 14;
const FINE_PER_DAY = parseInt(process.env.FINE_PER_DAY, 10) || 5;

// @desc    Issue a book to the logged-in user (or specified user if librarian/admin)
// @route   POST /api/transactions/issue
// @access  Private
const issueBook = asyncHandler(async (req, res) => {
  const { bookId, userId } = req.body;
  const targetUserId =
    req.user.role === 'member' ? req.user._id : userId || req.user._id;

  const book = await Book.findById(bookId);
  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }
  if (book.availableCopies < 1) {
    res.status(400);
    throw new Error('No available copies of this book');
  }

  const existing = await Transaction.findOne({
    book: bookId,
    user: targetUserId,
    status: { $in: ['issued', 'overdue'] },
  });
  if (existing) {
    res.status(400);
    throw new Error('This user already has an active loan for this book');
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + LOAN_PERIOD_DAYS);

  const transaction = await Transaction.create({
    book: bookId,
    user: targetUserId,
    dueDate,
  });

  book.availableCopies -= 1;
  await book.save();

  const populated = await transaction.populate(['book', 'user']);
  res.status(201).json({ success: true, data: populated });
});

// @desc    Return a book
// @route   PUT /api/transactions/:id/return
// @access  Private
const returnBook = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id).populate(
    'book'
  );
  if (!transaction) {
    res.status(404);
    throw new Error('Transaction not found');
  }
  if (transaction.status === 'returned') {
    res.status(400);
    throw new Error('This book has already been returned');
  }

  // members can only return their own loans
  if (
    req.user.role === 'member' &&
    transaction.user.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to return this transaction');
  }

  const now = new Date();
  transaction.returnDate = now;
  transaction.status = 'returned';

  if (now > transaction.dueDate) {
    const overdueDays = Math.ceil(
      (now - transaction.dueDate) / (1000 * 60 * 60 * 24)
    );
    transaction.fine = overdueDays * FINE_PER_DAY;
  }

  await transaction.save();

  const book = await Book.findById(transaction.book._id);
  book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
  await book.save();

  res.json({ success: true, data: transaction });
});

// @desc    Get logged-in user's transactions
// @route   GET /api/transactions/my
// @access  Private
const getMyTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ user: req.user._id })
    .populate('book', 'title author isbn coverImage')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: transactions });
});

// @desc    Get all transactions (admin/librarian) with optional status filter
// @route   GET /api/transactions?status=
// @access  Private/Admin/Librarian
const getAllTransactions = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  // mark overdue on read
  await Transaction.updateMany(
    { status: 'issued', dueDate: { $lt: new Date() } },
    { $set: { status: 'overdue' } }
  );

  const transactions = await Transaction.find(filter)
    .populate('book', 'title author isbn')
    .populate('user', 'name email')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: transactions });
});

module.exports = {
  issueBook,
  returnBook,
  getMyTransactions,
  getAllTransactions,
};
