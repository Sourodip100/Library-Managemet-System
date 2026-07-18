import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';
import * as bookService from '../services/bookService';
import * as transactionService from '../services/transactionService';

const emptyBook = {
  title: '',
  author: '',
  isbn: '',
  category: '',
  description: '',
  publishedYear: '',
  publisher: '',
  totalCopies: 1,
};

const AdminDashboard = () => {
  const [tab, setTab] = useState('books');
  const [books, setBooks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyBook);
  const [editingId, setEditingId] = useState(null);

  const loadBooks = async () => {
    const res = await bookService.getBooks({ limit: 100 });
    setBooks(res.data);
  };

  const loadTransactions = async () => {
    const data = await transactionService.getAllTransactions();
    setTransactions(data);
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      await Promise.all([loadBooks(), loadTransactions()]);
    } catch (err) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const resetForm = () => {
    setForm(emptyBook);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        totalCopies: Number(form.totalCopies),
        publishedYear: form.publishedYear ? Number(form.publishedYear) : undefined,
      };
      if (editingId) {
        await bookService.updateBook(editingId, payload);
        toast.success('Book updated');
      } else {
        await bookService.createBook(payload);
        toast.success('Book added');
      }
      resetForm();
      loadBooks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (book) => {
    setForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      description: book.description || '',
      publishedYear: book.publishedYear || '',
      publisher: book.publisher || '',
      totalCopies: book.totalCopies,
    });
    setEditingId(book._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this book?')) return;
    try {
      await bookService.deleteBook(id);
      toast.success('Book deleted');
      loadBooks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="page-container">
      <h2>Admin Dashboard</h2>
      <div className="tabs">
        <button
          className={tab === 'books' ? 'tab active' : 'tab'}
          onClick={() => setTab('books')}
        >
          Manage Books
        </button>
        <button
          className={tab === 'transactions' ? 'tab active' : 'tab'}
          onClick={() => setTab('transactions')}
        >
          All Transactions
        </button>
      </div>

      {tab === 'books' && (
        <div>
          <form className="admin-form" onSubmit={handleSubmit}>
            <h3>{editingId ? 'Edit Book' : 'Add New Book'}</h3>
            <div className="form-grid">
              <input
                name="title"
                placeholder="Title"
                value={form.title}
                onChange={handleChange}
                required
              />
              <input
                name="author"
                placeholder="Author"
                value={form.author}
                onChange={handleChange}
                required
              />
              <input
                name="isbn"
                placeholder="ISBN"
                value={form.isbn}
                onChange={handleChange}
                required
              />
              <input
                name="category"
                placeholder="Category"
                value={form.category}
                onChange={handleChange}
                required
              />
              <input
                name="publisher"
                placeholder="Publisher"
                value={form.publisher}
                onChange={handleChange}
              />
              <input
                name="publishedYear"
                placeholder="Published Year"
                type="number"
                value={form.publishedYear}
                onChange={handleChange}
              />
              <input
                name="totalCopies"
                placeholder="Total Copies"
                type="number"
                min="0"
                value={form.totalCopies}
                onChange={handleChange}
                required
              />
            </div>
            <textarea
              name="description"
              placeholder="Description"
              value={form.description}
              onChange={handleChange}
            />
            <div className="form-actions">
              <button className="btn btn-primary" type="submit">
                {editingId ? 'Update Book' : 'Add Book'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Category</th>
                <th>Copies (Avail/Total)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book._id}>
                  <td>{book.title}</td>
                  <td>{book.author}</td>
                  <td>{book.category}</td>
                  <td>
                    {book.availableCopies}/{book.totalCopies}
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => handleEdit(book)}
                    >
                      Edit
                    </button>{' '}
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(book._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'transactions' && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Book</th>
              <th>User</th>
              <th>Issue Date</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Fine</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t._id}>
                <td>{t.book?.title}</td>
                <td>{t.user?.name} ({t.user?.email})</td>
                <td>{new Date(t.issueDate).toLocaleDateString()}</td>
                <td>{new Date(t.dueDate).toLocaleDateString()}</td>
                <td>{t.status}</td>
                <td>{t.fine > 0 ? `$${t.fine}` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminDashboard;
