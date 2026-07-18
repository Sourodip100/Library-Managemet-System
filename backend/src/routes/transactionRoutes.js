const express = require('express');
const {
  issueBook,
  returnBook,
  getMyTransactions,
  getAllTransactions,
} = require('../controllers/transactionController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/issue', protect, issueBook);
router.put('/:id/return', protect, returnBook);
router.get('/my', protect, getMyTransactions);
router.get('/', protect, authorize('admin', 'librarian'), getAllTransactions);

module.exports = router;
