import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import * as bookService from '../services/bookService';
import * as transactionService from '../services/transactionService';

const BookDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);

  const loadBook = async () => {
    try {
      const data = await bookService.getBookById(id);
      setBook(data);
    } catch (err) {
      toast.error('Book not found');
      navigate('/books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBook();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleIssue = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setIssuing(true);
    try {
      await transactionService.issueBook(book._id);
      toast.success('Book issued! Check "My Loans" for the due date.');
      loadBook();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to issue book');
    } finally {
      setIssuing(false);
    }
  };

  if (loading) return <Loader />;
  if (!book) return null;

  return (
    <div className="page-container">
      <div className="book-detail">
        <div className="book-detail-cover">
          {book.coverImage ? (
            <img src={book.coverImage} alt={book.title} />
          ) : (
            <div className="book-card-placeholder large">📖</div>
          )}
        </div>
        <div className="book-detail-info">
          <h2>{book.title}</h2>
          <p className="book-card-author">by {book.author}</p>
          <p>
            <strong>Category:</strong> {book.category}
          </p>
          {book.publisher && (
            <p>
              <strong>Publisher:</strong> {book.publisher}
            </p>
          )}
          {book.publishedYear && (
            <p>
              <strong>Year:</strong> {book.publishedYear}
            </p>
          )}
          <p>
            <strong>ISBN:</strong> {book.isbn}
          </p>
          <p>{book.description}</p>
          <p
            className={
              book.availableCopies > 0 ? 'text-success' : 'text-danger'
            }
          >
            {book.availableCopies} of {book.totalCopies} copies available
          </p>
          <button
            className="btn btn-primary"
            onClick={handleIssue}
            disabled={book.availableCopies < 1 || issuing}
          >
            {issuing
              ? 'Issuing...'
              : book.availableCopies < 1
              ? 'Unavailable'
              : 'Borrow This Book'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookDetail;
