import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import BookCard from '../components/BookCard';
import Loader from '../components/Loader';
import * as bookService from '../services/bookService';

const BookList = () => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bookService.getBooks({ keyword, category, page, limit: 8 });
      setBooks(res.data);
      setPages(res.pages || 1);
    } catch (err) {
      toast.error('Failed to load books');
    } finally {
      setLoading(false);
    }
  }, [keyword, category, page]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  useEffect(() => {
    bookService
      .getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBooks();
  };

  return (
    <div className="page-container">
      <h2>Book Catalog</h2>
      <form className="search-bar" onSubmit={handleSearch}>
        <input
          placeholder="Search by title, author, or category..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button className="btn btn-primary" type="submit">
          Search
        </button>
      </form>

      {loading ? (
        <Loader />
      ) : books.length === 0 ? (
        <p>No books found.</p>
      ) : (
        <>
          <div className="book-grid">
            {books.map((book) => (
              <BookCard key={book._id} book={book} />
            ))}
          </div>
          <div className="pagination">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="btn btn-outline"
            >
              Previous
            </button>
            <span>
              Page {page} of {pages}
            </span>
            <button
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
              className="btn btn-outline"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default BookList;
