import api from './api';

export const issueBook = async (bookId, userId) => {
  const { data } = await api.post('/transactions/issue', { bookId, userId });
  return data.data;
};

export const returnBook = async (transactionId) => {
  const { data } = await api.put(`/transactions/${transactionId}/return`);
  return data.data;
};

export const getMyTransactions = async () => {
  const { data } = await api.get('/transactions/my');
  return data.data;
};

export const getAllTransactions = async (status) => {
  const { data } = await api.get('/transactions', {
    params: status ? { status } : {},
  });
  return data.data;
};
