import { useState, useEffect } from 'react';
import { workshopsAPI } from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import './Page.css';

const Workshops = () => {
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState<any>(null);
  const [availableImages, setAvailableImages] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [showImageBrowser, setShowImageBrowser] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    rating: '',
    location: '',
    icon: '',
    image: '',
  });

  useEffect(() => {
    fetchWorkshops();
  }, []);

  const fetchWorkshops = async () => {
    try {
      setLoading(true);
      const response = await workshopsAPI.getAll();
      console.log('Workshops response:', response);
      // Handle both response.data and direct array response
      const workshopsData = response.data || response || [];
      setWorkshops(Array.isArray(workshopsData) ? workshopsData : []);
    } catch (error: any) {
      console.error('Error fetching workshops:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch workshops';
      alert(`Failed to fetch workshops: ${errorMessage}`);
      setWorkshops([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableImages = async () => {
    try {
      setLoadingImages(true);
      const response = await workshopsAPI.getAvailableImages();
      setAvailableImages(response.data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
      setAvailableImages([]);
    } finally {
      setLoadingImages(false);
    }
  };

  const handleCreate = () => {
    setEditingWorkshop(null);
    setFormData({ name: '', rating: '', location: '', icon: '', image: '' });
    setShowImageBrowser(false);
    fetchAvailableImages();
    setModalOpen(true);
  };

  const handleEdit = (workshop: any) => {
    setEditingWorkshop(workshop);
    setFormData({
      name: workshop.name || '',
      rating: workshop.rating?.toString() || '',
      location: workshop.location || '',
      icon: workshop.icon || '',
      image: workshop.image || '',
    });
    setShowImageBrowser(false);
    fetchAvailableImages();
    setModalOpen(true);
  };

  const handleSelectImage = (imagePath: string) => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://autoassist.com.my/api';
    const baseUrl = API_BASE_URL.replace('/api', '');
    const filename = imagePath.split('/').pop() || imagePath;
    const imageUrl = `${baseUrl}/static/mobile/assets/img/${filename}`;
    setFormData({ ...formData, image: imageUrl });
    setShowImageBrowser(false);
  };

  const handleDelete = async (workshop: any) => {
    if (!confirm(`Are you sure you want to delete workshop "${workshop.name}"?`)) return;

    try {
      await workshopsAPI.delete(workshop.id);
      fetchWorkshops();
      alert('Workshop deleted successfully');
    } catch (error) {
      console.error('Error deleting workshop:', error);
      alert('Failed to delete workshop');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        rating: parseFloat(formData.rating),
      };
      if (editingWorkshop) {
        await workshopsAPI.update(editingWorkshop.id, data);
        alert('Workshop updated successfully');
      } else {
        await workshopsAPI.create(data);
        alert('Workshop created successfully');
      }
      setModalOpen(false);
      fetchWorkshops();
    } catch (error: any) {
      console.error('Error saving workshop:', error);
      alert(error.response?.data?.error || 'Failed to save workshop');
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'rating', label: 'Rating' },
    { key: 'location', label: 'Location' },
    { key: 'icon', label: 'Icon' },
    {
      key: 'image',
      label: 'Image',
      render: (value: string) => value ? (
        <img src={value} alt="Workshop" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
      ) : '-',
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-primary" onClick={handleCreate}>
          + Add Workshop
        </button>
      </div>
      <DataTable
        columns={columns}
        data={workshops}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
      />
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingWorkshop ? 'Edit Workshop' : 'Create Workshop'}
      >
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Rating *</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={formData.rating}
              onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Location *</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Icon *</label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="e.g. fa-wrench"
              required
            />
          </div>
          <div className="form-group">
            <label>Image</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="Image URL or browse from assets"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowImageBrowser(!showImageBrowser);
                  if (!showImageBrowser && availableImages.length === 0) {
                    fetchAvailableImages();
                  }
                }}
                style={{ whiteSpace: 'nowrap' }}
              >
                {showImageBrowser ? 'Hide Browser' : 'Browse Images'}
              </button>
            </div>
            
            {showImageBrowser && (
              <div style={{ 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px', 
                padding: '12px',
                marginTop: '8px',
                maxHeight: '300px',
                overflowY: 'auto',
                backgroundColor: '#f9fafb'
              }}>
                {loadingImages ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                    Loading images...
                  </div>
                ) : availableImages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                    No images found in /mobile/assets/img/
                  </div>
                ) : (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
                    gap: '12px' 
                  }}>
                    {availableImages.map((img: any, index: number) => {
                      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://autoassist.com.my/api';
                      const baseUrl = API_BASE_URL.replace('/api', '');
                      const imageUrl = `${baseUrl}/static/mobile/assets/img/${img.filename}`;
                      return (
                        <div
                          key={index}
                          onClick={() => handleSelectImage(img.path)}
                          style={{
                            cursor: 'pointer',
                            border: formData.image === imageUrl ? '2px solid #f97316' : '1px solid #e5e7eb',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            padding: '4px',
                            backgroundColor: formData.image === imageUrl ? '#fff7ed' : 'white',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (formData.image !== imageUrl) {
                              (e.currentTarget as HTMLElement).style.borderColor = '#f97316';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (formData.image !== imageUrl) {
                              (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb';
                            }
                          }}
                        >
                          <img
                            src={imageUrl}
                            alt={img.filename}
                            style={{
                              width: '100%',
                              height: '100px',
                              objectFit: 'cover',
                              display: 'block'
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <div style={{
                            fontSize: '11px',
                            color: '#6b7280',
                            padding: '4px',
                            textAlign: 'center',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {img.filename}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            
            {formData.image && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Preview:</div>
                <img 
                  src={formData.image} 
                  alt="Preview" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '200px', 
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingWorkshop ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Workshops;

