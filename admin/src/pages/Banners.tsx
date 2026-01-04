import { useState, useEffect } from 'react';
import { bannersAPI } from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import './Page.css';

const Banners = () => {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image: '',
    display_order: '0',
    is_active: true,
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await bannersAPI.getAll();
      console.log('Banners response:', response.data);
      setBanners(response.data || []);
    } catch (error: any) {
      console.error('Error fetching banners:', error);
      alert(`Failed to fetch banners: ${error.message || 'Unknown error'}`);
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingBanner(null);
    setFormData({ title: '', subtitle: '', image: '', display_order: '0', is_active: true });
    setModalOpen(true);
  };

  const handleEdit = (banner: any) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      image: banner.image || '',
      display_order: banner.display_order?.toString() || '0',
      is_active: banner.is_active !== undefined ? banner.is_active : true,
    });
    setModalOpen(true);
  };

  const handleDelete = async (banner: any) => {
    if (!confirm(`Are you sure you want to delete banner "${banner.title}"?`)) return;

    try {
      await bannersAPI.delete(banner.id);
      fetchBanners();
      alert('Banner deleted successfully');
    } catch (error) {
      console.error('Error deleting banner:', error);
      alert('Failed to delete banner');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        display_order: parseInt(formData.display_order) || 0,
        is_active: formData.is_active,
      };
      if (editingBanner) {
        await bannersAPI.update(editingBanner.id, data);
        alert('Banner updated successfully');
      } else {
        await bannersAPI.create(data);
        alert('Banner created successfully');
      }
      setModalOpen(false);
      fetchBanners();
    } catch (error: any) {
      console.error('Error saving banner:', error);
      alert(error.response?.data?.error || 'Failed to save banner');
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'image',
      label: 'Image',
      render: (value: string) => {
        if (!value) return <span style={{ color: '#9ca3af' }}>No image</span>;
        return (
          <img
            src={value}
            alt="Banner"
            style={{
              width: '120px',
              height: '60px',
              objectFit: 'cover',
              borderRadius: '4px',
              border: '1px solid #e5e7eb',
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement!.innerHTML = '<span style="color: #9ca3af;">Invalid image</span>';
            }}
          />
        );
      },
    },
    { key: 'title', label: 'Title' },
    { key: 'subtitle', label: 'Subtitle' },
    { key: 'display_order', label: 'Order' },
    {
      key: 'is_active',
      label: 'Status',
      render: (value: boolean) => (
        <span style={{ color: value ? '#10b981' : '#ef4444' }}>
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-primary" onClick={handleCreate}>
          + Add Banner
        </button>
      </div>
      <DataTable
        columns={columns}
        data={banners}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
      />
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingBanner ? 'Edit Banner' : 'Create Banner'}
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
            <label>Subtitle *</label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Image URL *</label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              required
            />
            {formData.image && (
              <img
                src={formData.image}
                alt="Preview"
                style={{
                  marginTop: '8px',
                  width: '100%',
                  maxHeight: '200px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  border: '1px solid #e5e7eb',
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            )}
          </div>
          <div className="form-group">
            <label>Display Order</label>
            <input
              type="number"
              min="0"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
            />
            <small style={{ color: '#6b7280', fontSize: '12px' }}>
              Lower numbers appear first. Default: 0
            </small>
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <span style={{ marginLeft: '8px' }}>Active</span>
            </label>
            <small style={{ color: '#6b7280', fontSize: '12px', display: 'block', marginTop: '4px' }}>
              Inactive banners won't be shown in the mobile app
            </small>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingBanner ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Banners;

