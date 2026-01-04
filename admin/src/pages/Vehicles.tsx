import { useState, useEffect } from 'react';
import { vehiclesAPI, usersAPI } from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import './Page.css';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [formData, setFormData] = useState({
    model: '',
    year: '',
    chassis: '',
    engine: '',
    plateNumber: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchVehicles();
    } else {
      setVehicles([]);
    }
  }, [selectedUserId]);

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data);
      if (response.data.length > 0 && !selectedUserId) {
        setSelectedUserId(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchVehicles = async () => {
    if (!selectedUserId) return;
    setLoading(true);
    try {
      const response = await vehiclesAPI.getAll(selectedUserId);
      setVehicles(response.data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      alert('Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    if (!selectedUserId) {
      alert('Please select a user first');
      return;
    }
    setEditingVehicle(null);
    setFormData({ model: '', year: '', chassis: '', engine: '', plateNumber: '' });
    setModalOpen(true);
  };

  const handleEdit = (vehicle: any) => {
    setEditingVehicle(vehicle);
    setFormData({
      model: vehicle.model || '',
      year: vehicle.year || '',
      chassis: vehicle.chassis || '',
      engine: vehicle.engine || '',
      plateNumber: vehicle.plateNumber || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (vehicle: any) => {
    if (!selectedUserId) return;
    if (!confirm(`Are you sure you want to delete vehicle "${vehicle.model}"?`)) return;

    try {
      await vehiclesAPI.delete(selectedUserId, vehicle.id);
      fetchVehicles();
      alert('Vehicle deleted successfully');
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      alert('Failed to delete vehicle');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    try {
      if (editingVehicle) {
        await vehiclesAPI.update(selectedUserId, editingVehicle.id, formData);
        alert('Vehicle updated successfully');
      } else {
        await vehiclesAPI.create(selectedUserId, formData);
        alert('Vehicle created successfully');
      }
      setModalOpen(false);
      fetchVehicles();
    } catch (error: any) {
      console.error('Error saving vehicle:', error);
      alert(error.response?.data?.error || 'Failed to save vehicle');
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'model', label: 'Model' },
    { key: 'year', label: 'Year' },
    { key: 'chassis', label: 'Chassis' },
    { key: 'engine', label: 'Engine' },
    { key: 'plateNumber', label: 'Plate Number' },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <select
            value={selectedUserId || ''}
            onChange={(e) => setSelectedUserId(parseInt(e.target.value))}
            style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #d1d5db' }}
          >
            <option value="">Select User</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
          <button className="btn-primary" onClick={handleCreate} disabled={!selectedUserId}>
            + Add Vehicle
          </button>
        </div>
      </div>
      {selectedUserId ? (
        <DataTable
          columns={columns}
          data={vehicles}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />
      ) : (
        <div className="empty-state">Please select a user to view their vehicles</div>
      )}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingVehicle ? 'Edit Vehicle' : 'Create Vehicle'}
      >
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label>Model *</label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Year *</label>
            <input
              type="text"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Chassis *</label>
            <input
              type="text"
              value={formData.chassis}
              onChange={(e) => setFormData({ ...formData, chassis: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Engine *</label>
            <input
              type="text"
              value={formData.engine}
              onChange={(e) => setFormData({ ...formData, engine: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Plate Number</label>
            <input
              type="text"
              value={formData.plateNumber}
              onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingVehicle ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Vehicles;

