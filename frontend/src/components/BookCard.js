import React from 'react';
import { Link } from 'react-router-dom';

const BookCard = ({ book }) => {
  return (
    <div className="book-card">
      <div className="book-card-cover">
        {book.coverImage ? (
          <img src={book.coverImage} alt={book.title} />
        ) : (
          <div className="book-card-placeholder">📖</div>
        )}
      </div>
      <div className="book-card-body">
        <h3>{book.title}</h3>
        <p className="book-card-author">{book.author}</p>
        <p className="book-card-category">{book.category}</p>
        <p
          className={
            book.availableCopies > 0 ? 'text-success' : 'text-danger'
          }
        >
          {book.availableCopies > 0
            ? `${book.availableCopies} available`
            : 'Not available'}
        </p>
        <Link to={`/books/${book._id}`} className="btn btn-primary btn-sm">
          View Details
        </Link>
      </div>
    </div>
  );
};

export default BookCard;
