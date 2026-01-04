import { useState, useEffect } from 'react';
import { productsAPI } from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import './Page.css';

const Products = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    image: '',
    stock: '',
  });

  useEffect(() => {
    fetchProducts();
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

  const handleCreate = () => {
    setEditingProduct(null);
    setFormData({ name: '', price: '', category: '', image: '', stock: '' });
    setModalOpen(true);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      price: product.price?.toString() || '',
      category: product.category || '',
      image: product.image || '',
      stock: product.stock?.toString() || '',
    });
    setModalOpen(true);
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
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
      };
      if (editingProduct) {
        await productsAPI.update(editingProduct.id, data);
        alert('Product updated successfully');
      } else {
        await productsAPI.create(data);
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
            <label>Image URL *</label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              required
            />
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

