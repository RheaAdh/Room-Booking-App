import React, { useState, useEffect } from 'react';
import api from '../config/api';
import './Dashboard.css';

const StatsScreen = () => {
  const [dashboardSummary, setDashboardSummary] = useState(null);
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
    } catch (error) {
      console.error('Error fetching stats data:', error);
    } finally {
      setLoading(false);
    }
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
        <h1>📊 Daily Statistics</h1>
        <button className="btn btn-primary" onClick={fetchStatsData}>
          🔄 Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard 
          title="Check-ins Today" 
          value={dashboardSummary.checkIns?.length || 0} 
          icon="🚪" 
          color="#3498db" 
        />
        <StatCard 
          title="Check-outs Today" 
          value={dashboardSummary.checkOuts?.length || 0} 
          icon="🚶‍♂️" 
          color="#e74c3c" 
        />
        <StatCard 
          title="Occupied Rooms" 
          value={dashboardSummary.occupiedRooms || 0} 
          icon="👥" 
          color="#2ecc71" 
        />
        <StatCard 
          title="Available Rooms" 
          value={dashboardSummary.availableRooms || 0} 
          icon="🏠" 
          color="#f39c12" 
        />
        <StatCard 
          title="Total Revenue" 
          value={`₹${dashboardSummary.revenue || 0}`} 
          icon="💰" 
          color="#9b59b6" 
        />
        <StatCard 
          title="Pending Dues" 
          value={`₹${dashboardSummary.pendingDues?.reduce((sum, due) => sum + (due.dueAmount || 0), 0) || 0}`} 
          icon="⏰" 
          color="#e67e22" 
        />
      </div>
    </div>
  );
};

export default StatsScreen;
