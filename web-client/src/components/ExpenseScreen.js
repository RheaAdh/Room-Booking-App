import React, { useState, useEffect } from 'react';
import api from '../config/api';

const ExpenseScreen = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'MAINTENANCE',
    expenseDate: new Date()
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await api.get('/expenses');
      setExpenses(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditExpense = (expense) => {
    setFormData({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      expenseDate: new Date(expense.expenseDate || expense.createdAt)
    });
    setSelectedExpense(expense);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDeleteExpense = async (expenseId) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await api.delete(`/expenses/${expenseId}`);
        fetchExpenses();
        alert('Expense deleted successfully!');
      } catch (error) {
        console.error('Error deleting expense:', error);
        alert('Error deleting expense. Please try again.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const expenseData = {
        ...formData,
        expenseDate: formData.expenseDate.toISOString().split('T')[0] // Send as YYYY-MM-DD format
      };

      if (isEditing && selectedExpense) {
        await api.put(`/expenses/${selectedExpense.id}`, expenseData);
        alert('Expense updated successfully!');
      } else {
        await api.post('/expenses', expenseData);
        alert('Expense added successfully!');
      }

      setShowModal(false);
      setIsEditing(false);
      setSelectedExpense(null);
      setFormData({ description: '', amount: '', category: 'MAINTENANCE', expenseDate: new Date() });
      fetchExpenses();
    } catch (error) {
      console.error('Error adding/updating expense:', error);
      alert('Error adding/updating expense. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading expenses...</p>
      </div>
    );
  }

  return (
    <div className="expense-screen">
      <div className="page-header">
        <h1>Expense Management</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Expense
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Expenses</h3>
        </div>
        <div className="card-body">
          {(!expenses || expenses.length === 0) ? (
            <div className="empty-state">
              <p>No expenses found. Add your first expense!</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(expenses || []).map(expense => (
                    <tr key={expense.id}>
                      <td>{expense.description}</td>
                      <td className="text-danger">₹{expense.amount}</td>
                      <td><span className="badge badge-info">{expense.category}</span></td>
                      <td>{new Date(expense.expenseDate || expense.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button 
                          className="btn btn-sm btn-warning"
                          onClick={() => handleEditExpense(expense)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteExpense(expense.id)}
                          style={{ marginLeft: '5px' }}
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
        </div>
      </div>

      {/* Add Expense Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{isEditing ? 'Edit Expense' : 'Add New Expense'}</h3>
              <button className="modal-close" onClick={() => {
                setShowModal(false);
                setIsEditing(false);
                setSelectedExpense(null);
              }}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label className="form-label">Description</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-control"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="UTILITIES">Utilities</option>
                  <option value="CLEANING">Cleaning</option>
                  <option value="SUPPLIES">Supplies</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.expenseDate.toISOString().split('T')[0]}
                  onChange={(e) => setFormData({...formData, expenseDate: new Date(e.target.value)})}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowModal(false);
                  setIsEditing(false);
                  setSelectedExpense(null);
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditing ? 'Update Expense' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseScreen;
