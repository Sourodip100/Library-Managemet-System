import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';
import * as transactionService from '../services/transactionService';

const statusBadge = (status) => {
  const map = {
    issued: 'badge-info',
    overdue: 'badge-danger',
    returned: 'badge-success',
  };
  return map[status] || 'badge-info';
};

const MyLoans = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [returningId, setReturningId] = useState(null);

  const loadLoans = async () => {
    try {
      const data = await transactionService.getMyTransactions();
      setLoans(data);
    } catch (err) {
      toast.error('Failed to load your loans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoans();
  }, []);

  const handleReturn = async (transactionId) => {
    setReturningId(transactionId);
    try {
      await transactionService.returnBook(transactionId);
      toast.success('Book returned successfully');
      loadLoans();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to return book');
    } finally {
      setReturningId(null);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="page-container">
      <h2>My Loans</h2>
      {loans.length === 0 ? (
        <p>You haven't borrowed any books yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Book</th>
              <th>Issue Date</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Fine</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((loan) => (
              <tr key={loan._id}>
                <td>{loan.book?.title}</td>
                <td>{new Date(loan.issueDate).toLocaleDateString()}</td>
                <td>{new Date(loan.dueDate).toLocaleDateString()}</td>
                <td>
                  <span className={`badge ${statusBadge(loan.status)}`}>
                    {loan.status}
                  </span>
                </td>
                <td>{loan.fine > 0 ? `$${loan.fine}` : '-'}</td>
                <td>
                  {loan.status !== 'returned' && (
                    <button
                      className="btn btn-sm btn-outline"
                      disabled={returningId === loan._id}
                      onClick={() => handleReturn(loan._id)}
                    >
                      {returningId === loan._id ? 'Returning...' : 'Return'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MyLoans;
