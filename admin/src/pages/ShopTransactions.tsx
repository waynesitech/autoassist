import { useState, useEffect } from 'react';
import { transactionsAPI } from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import './Page.css';

const ShopTransactions = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [formData, setFormData] = useState({
    type: 'Shop',
    title: '',
    amount: '',
    status: 'pending',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionsAPI.getAll({ type: 'Shop' });
      console.log('Shop response:', response.data);
      setTransactions(response.data || []);
    } catch (error: any) {
      console.error('Error fetching shop:', error);
      alert(`Failed to fetch shop: ${error.message || 'Unknown error'}`);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTransaction(null);
    setFormData({
      type: 'Shop',
      title: '',
      amount: '',
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
    });
    setModalOpen(true);
  };

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    // Handle date - convert ISO string to YYYY-MM-DD format
    let dateValue = transaction.date;
    if (dateValue && dateValue.includes('T')) {
      dateValue = dateValue.split('T')[0];
    }
    setFormData({
      type: 'Shop',
      title: transaction.title || '',
      amount: transaction.amount?.toString() || '',
      status: transaction.status || 'pending',
      date: dateValue || new Date().toISOString().split('T')[0],
    });
    setModalOpen(true);
  };

  const handleDelete = async (transaction: any) => {
    if (!confirm(`Are you sure you want to delete shop "${transaction.title}"?`)) return;

    try {
      await transactionsAPI.delete(transaction.id);
      fetchTransactions();
      alert('Shop deleted successfully');
    } catch (error) {
      console.error('Error deleting shop:', error);
      alert('Failed to delete shop');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        type: 'Shop',
        amount: parseFloat(formData.amount),
      };
      if (editingTransaction) {
        await transactionsAPI.update(editingTransaction.id, data);
        alert('Shop updated successfully');
      } else {
        await transactionsAPI.create(data);
        alert('Shop created successfully');
      }
      setModalOpen(false);
      fetchTransactions();
    } catch (error: any) {
      console.error('Error saving shop:', error);
      alert(error.response?.data?.error || 'Failed to save shop');
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Title' },
    {
      key: 'amount',
      label: 'Amount',
      render: (value: number | string) => {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        return `RM ${numValue?.toFixed(2) || '0.00'}`;
      },
    },
    { key: 'status', label: 'Status' },
    {
      key: 'date',
      label: 'Date',
      render: (value: string) => value ? new Date(value).toLocaleDateString() : '-',
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-primary" onClick={handleCreate}>
          + Add Shop
        </button>
      </div>
      <DataTable
        columns={columns}
        data={transactions}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
      />
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTransaction ? 'Edit Shop' : 'Create Shop'}
      >
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Amount (RM) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Status *</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              required
            >
              <option value="pending">Pending</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="form-group">
            <label>Date *</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingTransaction ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ShopTransactions;

