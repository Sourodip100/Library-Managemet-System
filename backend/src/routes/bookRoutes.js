const express = require('express');
const {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getCategories,
} = require('../controllers/bookController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/categories/all', getCategories);

router
  .route('/')
  .get(getBooks)
  .post(protect, authorize('admin', 'librarian'), createBook);

router
  .route('/:id')
  .get(getBookById)
  .put(protect, authorize('admin', 'librarian'), updateBook)
  .delete(protect, authorize('admin'), deleteBook);

module.exports = router;
