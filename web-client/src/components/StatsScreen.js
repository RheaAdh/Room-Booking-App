import React, { useState, useEffect } from 'react';
import api from '../config/api';
import './Dashboard.css';

const StatsScreen = () => {
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [additionalStats, setAdditionalStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatsData();
  }, []);

  const fetchStatsData = async () => {
    setLoading(true);
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get(`/dashboard/today-summary?date=${today}`);
      setDashboardSummary(response.data);
      
      // Fetch additional statistics
      await fetchAdditionalStats();
    } catch (error) {
      console.error('Error fetching stats data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdditionalStats = async () => {
    try {
      // Fetch bookings, payments, and expenses for comprehensive stats
      const [bookingsRes, paymentsRes, expensesRes, customersRes] = await Promise.all([
        api.get('/bookings'),
        api.get('/payments'),
        api.get('/expenses'),
        api.get('/customer')
      ]);

      const bookings = bookingsRes.data || [];
      const payments = paymentsRes.data || [];
      const expenses = expensesRes.data || [];
      const customers = customersRes.data || [];

      // Calculate comprehensive statistics
      const stats = calculateComprehensiveStats(bookings, payments, expenses, customers);
      setAdditionalStats(stats);
    } catch (error) {
      console.error('Error fetching additional stats:', error);
    }
  };

  const calculateComprehensiveStats = (bookings, payments, expenses, customers) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Filter data by date ranges
    const todayBookings = bookings.filter(b => {
      const bookingDate = new Date(b.createdAt);
      return bookingDate >= today;
    });

    const thisMonthBookings = bookings.filter(b => {
      const bookingDate = new Date(b.createdAt);
      return bookingDate >= thisMonth && bookingDate <= thisMonthEnd;
    });

    const todayPayments = payments.filter(p => {
      const paymentDate = new Date(p.paymentDate || p.createdAt);
      return paymentDate >= today;
    });

    const thisMonthPayments = payments.filter(p => {
      const paymentDate = new Date(p.paymentDate || p.createdAt);
      return paymentDate >= thisMonth && paymentDate <= thisMonthEnd;
    });

    const todayExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.expenseDate);
      return expenseDate >= today;
    });

    const thisMonthExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.expenseDate);
      return expenseDate >= thisMonth && expenseDate <= thisMonthEnd;
    });

    // Calculate financial metrics
    const todayRevenue = todayPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const thisMonthRevenue = thisMonthPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const todayExpensesTotal = todayExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const thisMonthExpensesTotal = thisMonthExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

    // Calculate operational metrics
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'CHECKEDIN').length;
    const pendingBookings = bookings.filter(b => b.bookingStatus === 'PENDING').length;
    const checkedOutBookings = bookings.filter(b => b.bookingStatus === 'CHECKEDOUT').length;

    // Calculate average booking value
    const totalBookingValue = bookings.reduce((sum, b) => sum + (parseFloat(b.totalAmount) || 0), 0);
    const avgBookingValue = totalBookings > 0 ? totalBookingValue / totalBookings : 0;

    // Calculate average stay duration
    const bookingsWithDuration = bookings.filter(b => b.checkInDate && b.checkOutDate);
    const totalStayDays = bookingsWithDuration.reduce((sum, b) => {
      const checkIn = new Date(b.checkInDate);
      const checkOut = new Date(b.checkOutDate);
      const diffTime = Math.abs(checkOut - checkIn);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return sum + diffDays;
    }, 0);
    const avgStayDuration = bookingsWithDuration.length > 0 ? totalStayDays / bookingsWithDuration.length : 0;

    // Calculate payment collection rate
    const totalPayments = payments.length;
    const completedPayments = payments.filter(p => p.paymentStatus === 'COMPLETED').length;
    const paymentCollectionRate = totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0;

    // Calculate customer metrics
    const totalCustomers = customers.length;
    const customersWithBookings = [...new Set(bookings.map(b => b.customerPhoneNumber))].length;
    const customerRetentionRate = totalCustomers > 0 ? (customersWithBookings / totalCustomers) * 100 : 0;

    // Calculate room performance
    const roomBookings = {};
    bookings.forEach(b => {
      if (b.roomId) {
        roomBookings[b.roomId] = (roomBookings[b.roomId] || 0) + 1;
      }
    });
    const topRoom = Object.entries(roomBookings).sort(([,a], [,b]) => b - a)[0];
    const topRoomId = topRoom ? topRoom[0] : 'N/A';
    const topRoomBookings = topRoom ? topRoom[1] : 0;

    // Calculate payment method breakdown
    const paymentMethods = {};
    payments.forEach(p => {
      const method = p.paymentMethod || 'UNKNOWN';
      paymentMethods[method] = (paymentMethods[method] || 0) + 1;
    });

    // Calculate expense categories
    const expenseCategories = {};
    expenses.forEach(e => {
      const category = e.category || 'OTHER';
      expenseCategories[category] = (expenseCategories[category] || 0) + parseFloat(e.amount || 0);
    });

    return {
      // Financial Metrics
      todayRevenue,
      thisMonthRevenue,
      todayExpensesTotal,
      thisMonthExpensesTotal,
      netProfitToday: todayRevenue - todayExpensesTotal,
      netProfitThisMonth: thisMonthRevenue - thisMonthExpensesTotal,
      
      // Operational Metrics
      totalBookings,
      confirmedBookings,
      pendingBookings,
      checkedOutBookings,
      avgBookingValue,
      avgStayDuration,
      paymentCollectionRate,
      
      // Customer Metrics
      totalCustomers,
      customersWithBookings,
      customerRetentionRate,
      
      // Performance Metrics
      topRoomId,
      topRoomBookings,
      paymentMethods,
      expenseCategories,
      
      // Conversion Rates
      bookingConversionRate: totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0,
      customerConversionRate: totalCustomers > 0 ? (customersWithBookings / totalCustomers) * 100 : 0
    };
  };

  const StatCard = ({ title, value, icon, color }) => (
    <div className="stat-card" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <h3 className="stat-title">{title}</h3>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading stats...</p>
      </div>
    );
  }

  if (!dashboardSummary) {
    return (
      <div className="error-state">
        <p>Failed to load dashboard data</p>
        <button onClick={fetchStatsData} className="btn btn-primary">Retry</button>
      </div>
    );
  }

  return (
    <div className="stats-screen">
      <div className="page-header">
        <h1>📊 Comprehensive Statistics</h1>
        <button className="btn btn-primary" onClick={fetchStatsData}>
          🔄 Refresh
        </button>
      </div>


      {/* Financial Performance */}
      {additionalStats && (
        <div className="stats-section">
          <h2>💰 Financial Performance</h2>
          <div className="stats-grid">
            <StatCard 
              title="Today's Revenue" 
              value={`₹${additionalStats.todayRevenue.toFixed(2)}`} 
              icon="💵" 
              color="#27ae60" 
            />
            <StatCard 
              title="This Month Revenue" 
              value={`₹${additionalStats.thisMonthRevenue.toFixed(2)}`} 
              icon="📈" 
              color="#2ecc71" 
            />
            <StatCard 
              title="Today's Expenses" 
              value={`₹${additionalStats.todayExpensesTotal.toFixed(2)}`} 
              icon="💸" 
              color="#e74c3c" 
            />
            <StatCard 
              title="This Month Expenses" 
              value={`₹${additionalStats.thisMonthExpensesTotal.toFixed(2)}`} 
              icon="📉" 
              color="#c0392b" 
            />
            <StatCard 
              title="Net Profit Today" 
              value={`₹${additionalStats.netProfitToday.toFixed(2)}`} 
              icon="💎" 
              color={additionalStats.netProfitToday >= 0 ? "#27ae60" : "#e74c3c"} 
            />
            <StatCard 
              title="Net Profit This Month" 
              value={`₹${additionalStats.netProfitThisMonth.toFixed(2)}`} 
              icon="🏆" 
              color={additionalStats.netProfitThisMonth >= 0 ? "#27ae60" : "#e74c3c"} 
            />
          </div>
        </div>
      )}

      {/* Business Intelligence */}
      {additionalStats && (
        <div className="stats-section">
          <h2>🧠 Business Intelligence</h2>
          <div className="stats-grid">
            <StatCard 
              title="Total Bookings" 
              value={additionalStats.totalBookings} 
              icon="📝" 
              color="#3498db" 
            />
            <StatCard 
              title="Confirmed Bookings" 
              value={additionalStats.confirmedBookings} 
              icon="✅" 
              color="#2ecc71" 
            />
            <StatCard 
              title="Pending Bookings" 
              value={additionalStats.pendingBookings} 
              icon="⏳" 
              color="#f39c12" 
            />
            <StatCard 
              title="Average Booking Value" 
              value={`₹${additionalStats.avgBookingValue.toFixed(2)}`} 
              icon="💳" 
              color="#9b59b6" 
            />
            <StatCard 
              title="Average Stay Duration" 
              value={`${additionalStats.avgStayDuration.toFixed(1)} days`} 
              icon="⏰" 
              color="#e67e22" 
            />
            <StatCard 
              title="Payment Collection Rate" 
              value={`${additionalStats.paymentCollectionRate.toFixed(1)}%`} 
              icon="💯" 
              color="#1abc9c" 
            />
          </div>
        </div>
      )}

      {/* Customer Analytics */}
      {additionalStats && (
        <div className="stats-section">
          <h2>👥 Customer Analytics</h2>
          <div className="stats-grid">
            <StatCard 
              title="Total Customers" 
              value={additionalStats.totalCustomers} 
              icon="👤" 
              color="#3498db" 
            />
            <StatCard 
              title="Active Customers" 
              value={additionalStats.customersWithBookings} 
              icon="🎯" 
              color="#2ecc71" 
            />
            <StatCard 
              title="Customer Retention Rate" 
              value={`${additionalStats.customerRetentionRate.toFixed(1)}%`} 
              icon="🔄" 
              color="#e67e22" 
            />
            <StatCard 
              title="Booking Conversion Rate" 
              value={`${additionalStats.bookingConversionRate.toFixed(1)}%`} 
              icon="📊" 
              color="#9b59b6" 
            />
            <StatCard 
              title="Top Performing Room" 
              value={`Room ${additionalStats.topRoomId} (${additionalStats.topRoomBookings} bookings)`} 
              icon="🏆" 
              color="#f39c12" 
            />
            <StatCard 
              title="Pending Dues" 
              value={`₹${dashboardSummary?.pendingDues?.reduce((sum, due) => sum + (due.dueAmount || 0), 0) || 0}`} 
              icon="⏰" 
              color="#e74c3c" 
            />
          </div>
        </div>
      )}

      {/* Payment Methods Breakdown */}
      {additionalStats && additionalStats.paymentMethods && Object.keys(additionalStats.paymentMethods).length > 0 && (
        <div className="stats-section">
          <h2>💳 Payment Methods</h2>
          <div className="stats-grid">
            {Object.entries(additionalStats.paymentMethods).map(([method, count]) => (
              <StatCard 
                key={method}
                title={`${method} Payments`} 
                value={count} 
                icon="💳" 
                color="#3498db" 
              />
            ))}
          </div>
        </div>
      )}

      {/* Expense Categories */}
      {additionalStats && additionalStats.expenseCategories && Object.keys(additionalStats.expenseCategories).length > 0 && (
        <div className="stats-section">
          <h2>💸 Expense Categories</h2>
          <div className="stats-grid">
            {Object.entries(additionalStats.expenseCategories).map(([category, amount]) => (
              <StatCard 
                key={category}
                title={`${category} Expenses`} 
                value={`₹${amount.toFixed(2)}`} 
                icon="📊" 
                color="#e74c3c" 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsScreen;
