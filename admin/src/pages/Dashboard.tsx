import { useEffect, useState } from 'react';
import { usersAPI, workshopsAPI, productsAPI, transactionsAPI } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    workshops: 0,
    products: 0,
    shopTransactions: 0,
    towingTransactions: 0,
    quotationTransactions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, workshopsRes, productsRes, shopRes, towingRes, quotationRes] = await Promise.all([
          usersAPI.getAll(),
          workshopsAPI.getAll(),
          productsAPI.getAll(),
          transactionsAPI.getAll({ type: 'Shop' }),
          transactionsAPI.getAll({ type: 'Towing' }),
          transactionsAPI.getAll({ type: 'Quotation' }),
        ]);

        setStats({
          users: usersRes.data.length,
          workshops: workshopsRes.data.length,
          products: productsRes.data.length,
          shopTransactions: shopRes.data.length,
          towingTransactions: towingRes.data.length,
          quotationTransactions: quotationRes.data.length,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <div className="stat-label">Total Users</div>
            <div className="stat-value">{stats.users}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔧</div>
          <div className="stat-info">
            <div className="stat-label">Workshops</div>
            <div className="stat-value">{stats.workshops}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🛍️</div>
          <div className="stat-info">
            <div className="stat-label">Products</div>
            <div className="stat-value">{stats.products}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🛒</div>
          <div className="stat-info">
            <div className="stat-label">Shop</div>
            <div className="stat-value">{stats.shopTransactions}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🚛</div>
          <div className="stat-info">
            <div className="stat-label">Towing</div>
            <div className="stat-value">{stats.towingTransactions}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <div className="stat-label">Quotation</div>
            <div className="stat-value">{stats.quotationTransactions}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

