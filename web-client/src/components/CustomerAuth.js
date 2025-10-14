import React, { useState } from 'react';
import api from '../config/api';
import './CustomerAuth.css';

const CustomerAuth = ({ onLogin, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: '',
    password: '',
    name: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Login
        const response = await api.post('/auth/customer/login', {
          phoneNumber: formData.phoneNumber,
          password: formData.password
        });
        
        if (response.data.success) {
          localStorage.setItem('customerToken', response.data.token);
          localStorage.setItem('customerData', JSON.stringify(response.data.customer));
          onLogin(response.data.customer);
          onClose();
        }
      } else {
        // Register
        const response = await api.post('/auth/customer/register', {
          phoneNumber: formData.phoneNumber,
          password: formData.password,
          name: formData.name
        });
        
        if (response.data.success) {
          alert('Registration successful! Please login.');
          setIsLogin(true);
          setFormData({ phoneNumber: '', password: '', name: '' });
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  return (
    <div className="customer-auth-overlay">
      <div className="customer-auth-modal">
        <div className="auth-header">
          <h2>{isLogin ? 'Customer Login' : 'Customer Registration'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="auth-tabs">
          <button 
            className={`tab ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button 
            className={`tab ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {!isLogin && (
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                className="form-control"
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div className="form-group">
            <label>Phone Number *</label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              required
              className="form-control"
              placeholder="Enter your phone number"
            />
          </div>


          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              required
              className="form-control"
              placeholder="Enter your password"
              minLength="6"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button"
              className="link-btn"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Register here' : 'Login here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerAuth;
