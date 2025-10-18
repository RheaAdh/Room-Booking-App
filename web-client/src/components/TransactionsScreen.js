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
      // Fetch payments data for transactions
      const response = await api.get('/payments');
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
              <h4>💰 Payments ({transactions?.length || 0})</h4>
              {transactions && transactions.length > 0 ? (
                <div className="transactions-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Booking ID</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Status</th>
                        <th>Transaction ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((payment, index) => (
                        <tr key={index}>
                          <td>{formatDate(payment.paymentDate)}</td>
                          <td>#{payment.bookingId}</td>
                          <td className="amount positive">{formatAmount(payment.amount)}</td>
                          <td>
                            <span className={`payment-mode ${payment.paymentMethod?.toLowerCase()}`}>
                              {payment.paymentMethod}
                            </span>
                          </td>
                          <td>
                            <span className={`payment-status ${payment.paymentStatus?.toLowerCase()}`}>
                              {payment.paymentStatus}
                            </span>
                          </td>
                          <td>{payment.transactionId || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-data">No payments found</p>
              )}
            </div>


            {/* Summary */}
            <div className="transactions-summary">
              <div className="summary-cards">
                <div className="summary-card">
                  <h5>Total Payments</h5>
                  <p className="amount positive">
                    {formatAmount(transactions?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0)}
                  </p>
                </div>
                <div className="summary-card">
                  <h5>Completed Payments</h5>
                  <p className="amount positive">
                    {formatAmount(transactions?.filter(p => p.paymentStatus === 'COMPLETED').reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0)}
                  </p>
                </div>
                <div className="summary-card">
                  <h5>Pending Payments</h5>
                  <p className="amount negative">
                    {formatAmount(transactions?.filter(p => p.paymentStatus === 'PENDING').reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0)}
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
