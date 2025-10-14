import React, { useState, useEffect } from 'react';
import api from '../config/api';
import './Dashboard.css';

const TransactionsScreen = () => {
  const [transactions, setTransactions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactionsData();
  }, []);

  const fetchTransactionsData = async () => {
    setLoading(true);
    try {
      // Use bookings endpoint since it contains transaction-like data
      const response = await api.get('/bookings');
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount) => {
    return `₹${amount || 0}`;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading transactions...</p>
      </div>
    );
  }

  if (!transactions) {
    return (
      <div className="error-state">
        <p>Failed to load transactions data</p>
        <button onClick={fetchTransactionsData} className="btn btn-primary">Retry</button>
      </div>
    );
  }

  return (
    <div className="transactions-screen">
      <div className="page-header">
        <h1>💳 All Transactions</h1>
        <button className="btn btn-primary" onClick={fetchTransactionsData}>
          🔄 Refresh
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Transaction History</h3>
        </div>
        <div className="card-body">
          <div className="transactions-content">
            {/* Payments */}
            <div className="transactions-section">
              <h4>💰 Payments ({transactions.payments?.length || 0})</h4>
              {transactions.payments && transactions.payments.length > 0 ? (
                <div className="transactions-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Room</th>
                        <th>Amount</th>
                        <th>Mode</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.payments.map((payment, index) => (
                        <tr key={index}>
                          <td>{formatDate(payment.paymentDate)}</td>
                          <td>{payment.customerName}</td>
                          <td>Room {payment.roomNumber}</td>
                          <td className="amount positive">{formatAmount(payment.amount)}</td>
                          <td>
                            <span className={`payment-mode ${payment.paymentMode?.toLowerCase()}`}>
                              {payment.paymentMode}
                            </span>
                          </td>
                          <td>{payment.description || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-data">No payments found</p>
              )}
            </div>

            {/* Expenses */}
            <div className="transactions-section">
              <h4>💸 Expenses ({transactions.expenses?.length || 0})</h4>
              {transactions.expenses && transactions.expenses.length > 0 ? (
                <div className="transactions-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Description</th>
                        <th>Payment Mode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.expenses.map((expense, index) => (
                        <tr key={index}>
                          <td>{formatDate(expense.expenseDate)}</td>
                          <td>
                            <span className="expense-category">
                              {expense.category}
                            </span>
                          </td>
                          <td className="amount negative">{formatAmount(expense.amount)}</td>
                          <td>{expense.description || '-'}</td>
                          <td>
                            <span className={`payment-mode ${expense.paymentMode?.toLowerCase()}`}>
                              {expense.paymentMode}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-data">No expenses found</p>
              )}
            </div>

            {/* Summary */}
            <div className="transactions-summary">
              <div className="summary-cards">
                <div className="summary-card">
                  <h5>Total Payments</h5>
                  <p className="amount positive">{formatAmount(transactions.totalPayments)}</p>
                </div>
                <div className="summary-card">
                  <h5>Total Expenses</h5>
                  <p className="amount negative">{formatAmount(transactions.totalExpenses)}</p>
                </div>
                <div className="summary-card">
                  <h5>Net Cash Flow</h5>
                  <p className={`amount ${(transactions.totalPayments || 0) - (transactions.totalExpenses || 0) >= 0 ? 'positive' : 'negative'}`}>
                    {formatAmount((transactions.totalPayments || 0) - (transactions.totalExpenses || 0))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsScreen;
