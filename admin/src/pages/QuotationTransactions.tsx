import { useState, useEffect } from 'react';
import { transactionsAPI, workshopsAPI } from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import './Page.css';

const QuotationTransactions = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingTransaction, setViewingTransaction] = useState<any>(null);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [formData, setFormData] = useState({
    type: 'Quotation',
    model: '',
    year: '',
    engine: '',
    chassis: '',
    quoteType: 'brief',
    workshopId: '',
    amount: '',
    status: 'pending',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchTransactions();
    fetchWorkshops();
  }, []);

  const fetchWorkshops = async () => {
    try {
      const response = await workshopsAPI.getAll();
      setWorkshops(response.data || []);
    } catch (error: any) {
      console.error('Error fetching workshops:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionsAPI.getAll({ type: 'Quotation' });
      console.log('Quotation response:', response.data);
      setTransactions(response.data || []);
    } catch (error: any) {
      console.error('Error fetching quotation:', error);
      alert(`Failed to fetch quotation: ${error.message || 'Unknown error'}`);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTransaction(null);
    setFormData({
      type: 'Quotation',
      model: '',
      year: '',
      engine: '',
      chassis: '',
      quoteType: 'brief',
      workshopId: '',
      amount: '5',
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
    
    // Parse title to extract model and quote type if available
    // Format: "Brief Quote: Honda Civic" or "Detailed Quote: Honda Civic"
    let model = '';
    let quoteType = 'brief';
    if (transaction.title) {
      const match = transaction.title.match(/(Brief|Detailed)\s+Quote:\s*(.+)/i);
      if (match) {
        quoteType = match[1].toLowerCase();
        model = match[2].trim();
      }
    }
    
    setFormData({
      type: 'Quotation',
      model: model || '',
      year: transaction.year || '',
      engine: transaction.engine || '',
      chassis: transaction.chassis || '',
      quoteType: quoteType,
      workshopId: transaction.workshopId?.toString() || '',
      amount: transaction.amount?.toString() || (quoteType === 'brief' ? '5' : '15'),
      status: transaction.status || 'pending',
      date: dateValue || new Date().toISOString().split('T')[0],
    });
    setModalOpen(true);
  };

  const handleView = (transaction: any) => {
    setViewingTransaction(transaction);
    setViewModalOpen(true);
  };

  const handleDelete = async (transaction: any) => {
    if (!confirm(`Are you sure you want to delete quotation "${transaction.title}"?`)) return;

    try {
      await transactionsAPI.delete(transaction.id);
      fetchTransactions();
      alert('Quotation deleted successfully');
    } catch (error) {
      console.error('Error deleting quotation:', error);
      alert('Failed to delete quotation');
    }
  };

  const handleQuoteTypeChange = (quoteType: string) => {
    const amount = quoteType === 'brief' ? '5' : '15';
    setFormData({ ...formData, quoteType, amount });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Construct title similar to mobile app format
      const quoteTypeLabel = formData.quoteType === 'brief' ? 'Brief' : 'Detailed';
      const title = `${quoteTypeLabel} Quote: ${formData.model || 'Vehicle'}`;
      
      const data = {
        type: 'Quotation',
        title,
        model: formData.model,
        year: formData.year,
        engine: formData.engine,
        chassis: formData.chassis,
        quoteType: formData.quoteType,
        workshopId: formData.workshopId ? parseInt(formData.workshopId) : null,
        amount: parseFloat(formData.amount),
        status: formData.status,
        date: formData.date,
      };
      
      if (editingTransaction) {
        await transactionsAPI.update(editingTransaction.id, data);
        alert('Quotation updated successfully');
      } else {
        await transactionsAPI.create(data);
        alert('Quotation created successfully');
      }
      setModalOpen(false);
      fetchTransactions();
    } catch (error: any) {
      console.error('Error saving quotation:', error);
      alert(error.response?.data?.error || 'Failed to save quotation');
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
          + Add Quotation
        </button>
      </div>
      <DataTable
        columns={columns}
        data={transactions}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
      />
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTransaction ? 'Edit Quotation' : 'Create Quotation'}
      >
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label>Workshop Partner *</label>
            <select
              value={formData.workshopId}
              onChange={(e) => setFormData({ ...formData, workshopId: e.target.value })}
              required
            >
              <option value="">Select a workshop</option>
              {workshops.map((workshop) => (
                <option key={workshop.id} value={workshop.id}>
                  {workshop.name} - {workshop.location}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Model Name *</label>
            <input
              type="text"
              placeholder="e.g. Honda Civic RS"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Year *</label>
              <input
                type="text"
                placeholder="e.g. 2020"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Engine No. *</label>
              <input
                type="text"
                placeholder="Engine number"
                value={formData.engine}
                onChange={(e) => setFormData({ ...formData, engine: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Chassis Number *</label>
            <input
              type="text"
              placeholder="Chassis number"
              value={formData.chassis}
              onChange={(e) => setFormData({ ...formData, chassis: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Quote Type *</label>
            <select
              value={formData.quoteType}
              onChange={(e) => handleQuoteTypeChange(e.target.value)}
              required
            >
              <option value="brief">Brief Report (RM 5) - Quick market valuation estimate</option>
              <option value="detailed">Detailed Report (RM 15) - Full condition & market analysis</option>
            </select>
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
              readOnly
              style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>
              Amount is automatically set based on quote type
            </small>
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

      {/* View Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Quotation Details"
      >
        {viewingTransaction && (
          <div className="view-details">
            <div className="detail-section">
              <h3>Transaction Information</h3>
              <div className="detail-row">
                <span className="detail-label">ID:</span>
                <span className="detail-value">{viewingTransaction.id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Title:</span>
                <span className="detail-value">{viewingTransaction.title || '-'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className="detail-value">
                  <span className={`status-badge status-${viewingTransaction.status}`}>
                    {viewingTransaction.status?.charAt(0).toUpperCase() + viewingTransaction.status?.slice(1) || '-'}
                  </span>
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Amount:</span>
                <span className="detail-value">
                  RM {typeof viewingTransaction.amount === 'string' 
                    ? parseFloat(viewingTransaction.amount).toFixed(2) 
                    : viewingTransaction.amount?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date:</span>
                <span className="detail-value">
                  {viewingTransaction.date 
                    ? new Date(viewingTransaction.date).toLocaleDateString() 
                    : '-'}
                </span>
              </div>
            </div>

            <div className="detail-section">
              <h3>Vehicle Information</h3>
              <div className="detail-row">
                <span className="detail-label">Model:</span>
                <span className="detail-value">
                  {(() => {
                    if (viewingTransaction.model) return viewingTransaction.model;
                    if (viewingTransaction.title) {
                      const match = viewingTransaction.title.match(/(?:Brief|Detailed)\s+Quote:\s*(.+)/i);
                      return match ? match[1].trim() : '-';
                    }
                    return '-';
                  })()}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Year:</span>
                <span className="detail-value">{viewingTransaction.year || '-'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Engine No.:</span>
                <span className="detail-value">{viewingTransaction.engine || '-'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Chassis Number:</span>
                <span className="detail-value">{viewingTransaction.chassis || '-'}</span>
              </div>
            </div>

            <div className="detail-section">
              <h3>Quotation Details</h3>
              <div className="detail-row">
                <span className="detail-label">Quote Type:</span>
                <span className="detail-value">
                  {(() => {
                    if (viewingTransaction.quoteType) {
                      return viewingTransaction.quoteType === 'brief' ? 'Brief Report' : 'Detailed Report';
                    }
                    if (viewingTransaction.title) {
                      const match = viewingTransaction.title.match(/(Brief|Detailed)/i);
                      return match ? `${match[1]} Report` : '-';
                    }
                    return '-';
                  })()}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Workshop:</span>
                <span className="detail-value">
                  {viewingTransaction.workshopId 
                    ? (() => {
                        const workshop = workshops.find(w => w.id === viewingTransaction.workshopId);
                        return workshop ? `${workshop.name} - ${workshop.location}` : `Workshop ID: ${viewingTransaction.workshopId}`;
                      })()
                    : '-'}
                </span>
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: '24px', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setViewModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default QuotationTransactions;

