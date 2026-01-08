import { useState, useEffect, useRef } from 'react';
import { productsAPI, workshopsAPI } from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import './Page.css';

const Products = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [availableImages, setAvailableImages] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [showImageBrowser, setShowImageBrowser] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    image: '',
    stock: '',
    workshop_id: '',
  });

  useEffect(() => {
    fetchProducts();
    fetchWorkshops();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll();
      console.log('Products response:', response.data);
      setProducts(response.data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      alert(`Failed to fetch products: ${error.message || 'Unknown error'}`);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkshops = async () => {
    try {
      const response = await workshopsAPI.getAll();
      setWorkshops(response.data || []);
    } catch (error: any) {
      console.error('Error fetching workshops:', error);
      setWorkshops([]);
    }
  };

  const fetchAvailableImages = async () => {
    try {
      setLoadingImages(true);
      const response = await productsAPI.getAvailableImages();
      setAvailableImages(response.data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
      setAvailableImages([]);
    } finally {
      setLoadingImages(false);
    }
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setFormData({ name: '', price: '', category: '', image: '', stock: '', workshop_id: '' });
    setShowImageBrowser(false);
    fetchAvailableImages();
    setModalOpen(true);
  };

  const handleEdit = (product: any) => {
    console.log('Editing product:', product);
    console.log('Product workshop_id:', product.workshop_id, 'type:', typeof product.workshop_id);
    setEditingProduct(product);
    const workshopIdValue = product.workshop_id !== null && product.workshop_id !== undefined 
      ? product.workshop_id.toString() 
      : '';
    console.log('Setting formData.workshop_id to:', workshopIdValue);
    setFormData({
      name: product.name || '',
      price: product.price?.toString() || '',
      category: product.category || '',
      image: product.image || '',
      stock: product.stock?.toString() || '',
      workshop_id: workshopIdValue,
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, WebP, or SVG)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      const response = await productsAPI.uploadImage(file);
      if (response.data.success) {
        setFormData({ ...formData, image: response.data.url });
        // Refresh available images to show the newly uploaded one
        fetchAvailableImages();
        alert('Image uploaded successfully!');
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert(error.response?.data?.error || error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleDelete = async (product: any) => {
    if (!confirm(`Are you sure you want to delete product "${product.name}"?`)) return;

    try {
      await productsAPI.delete(product.id);
      fetchProducts();
      alert('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Parse workshop_id properly - ensure it's either a valid integer (foreign key) or null
      console.log('=== SUBMITTING PRODUCT ===');
      console.log('formData.workshop_id:', formData.workshop_id, 'type:', typeof formData.workshop_id);
      let workshopId: number | null = null;
      if (formData.workshop_id && formData.workshop_id.trim() !== '') {
        const parsed = parseInt(formData.workshop_id, 10);
        console.log('Parsed workshop_id:', parsed, 'isNaN:', isNaN(parsed), 'isInteger:', Number.isInteger(parsed));
        // Validate it's a positive integer (valid foreign key)
        if (!isNaN(parsed) && parsed > 0 && Number.isInteger(parsed)) {
          workshopId = parsed;
          console.log('✓ Valid workshop_id:', workshopId);
        } else {
          console.log('✗ Invalid workshop_id - not a valid integer');
        }
      } else {
        console.log('⚠ workshop_id is empty or null');
      }

      // Build data object, explicitly setting each field to avoid string versions
      // workshop_id must be an integer (foreign key to workshops table) or null
      const data: {
        name: string;
        price: number;
        category: string;
        image: string;
        stock: number;
        workshop_id: number | null;
      } = {
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
        image: formData.image,
        stock: parseInt(formData.stock),
        workshop_id: workshopId, // Integer foreign key to workshops.id or null
      };
      console.log('Submitting product data:', data);
      console.log('workshop_id in data:', data.workshop_id, 'type:', typeof data.workshop_id);
      let response;
      if (editingProduct) {
        console.log('Updating product ID:', editingProduct.id);
        console.log('Original product workshop_id:', editingProduct.workshop_id);
        response = await productsAPI.update(editingProduct.id, data);
        console.log('Update response:', response.data);
        console.log('Update response workshop_id:', response.data.workshop_id);
        console.log('Update response _debug:', response.data._debug);
        if (response.data._debug) {
          console.log('=== DEBUG INFO ===');
          console.log('Received workshop_id:', response.data._debug.receivedWorkshopId);
          console.log('Normalized workshop_id:', response.data._debug.normalizedWorkshopId);
          console.log('Update query:', response.data._debug.updateQuery);
          console.log('Update values:', response.data._debug.updateValues);
          console.log('Database workshop_id:', response.data._debug.databaseWorkshopId);
          console.log('==================');
        } else {
          console.warn('No _debug object in response - backend might not be processing correctly');
        }
        alert('Product updated successfully');
      } else {
        response = await productsAPI.create(data);
        console.log('Create response:', response.data);
        alert('Product created successfully');
      }
      setModalOpen(false);
      fetchProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      alert(error.response?.data?.error || 'Failed to save product');
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
            alt="Product"
            style={{
              width: '60px',
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
    { key: 'name', label: 'Name' },
    {
      key: 'price',
      label: 'Price',
      render: (value: number | string) => {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        return `RM ${numValue?.toFixed(2) || '0.00'}`;
      },
    },
    { key: 'category', label: 'Category' },
    { key: 'stock', label: 'Stock' },
    {
      key: 'workshop_id',
      label: 'Workshop',
      render: (value: number, _row: any) => {
        if (!value) return <span style={{ color: '#9ca3af' }}>None</span>;
        const workshop = workshops.find(w => w.id === value);
        return workshop ? workshop.name : `ID: ${value}`;
      },
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-primary" onClick={handleCreate}>
          + Add Product
        </button>
      </div>
      <DataTable
        columns={columns}
        data={products}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
      />
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Create Product'}
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
            <label>Price (RM) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Category *</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Image *</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="Image URL or browse from assets"
                style={{ flex: 1, minWidth: '200px' }}
                required
              />
              <label style={{ position: 'relative' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={uploading}
                  style={{ whiteSpace: 'nowrap', cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1 }}
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                >
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </button>
              </label>
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
          <div className="form-group">
            <label>Stock *</label>
            <input
              type="number"
              min="0"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Workshop</label>
            <select
              value={formData.workshop_id}
              onChange={(e) => setFormData({ ...formData, workshop_id: e.target.value })}
            >
              <option value="">Select a workshop (optional)</option>
              {workshops.map((workshop) => (
                <option key={workshop.id} value={workshop.id.toString()}>
                  {workshop.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingProduct ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Products;

