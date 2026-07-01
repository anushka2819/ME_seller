import React, { useState, useEffect } from 'react';
import SkeletonLoader from '../components/SkeletonLoader';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Package,
  Layers,
  Eye,
  EyeOff,
  ArrowUpDown,
  TrendingUp,
  Image as ImageIcon
} from 'lucide-react';
import { getProducts, saveProduct, deleteProduct, uploadProductImage } from '../utils/product';

const CATEGORIES = ['Wellness', 'Accessories', 'Stationery', 'Apparel', 'Crafts'];

const InventoryScreen = () => {
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [sizeVariants, setSizeVariants] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [images, setImages] = useState([]); // Existing URLs
  const [imageFiles, setImageFiles] = useState([]); // New file uploads
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState('active');

  async function loadProducts() {
    setIsLoadingProducts(true);
    const data = await getProducts();
    setProducts(data);
    setIsLoadingProducts(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setCategory(CATEGORIES[0]);
    setPrice('');
    setStock('');
    setSizeVariants('');
    setLength('');
    setWidth('');
    setHeight('');
    setWeight('');
    setImages([]);
    setImageFiles([]);
    setStatus('active');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prod) => {
    setEditingProduct(prod);
    setName(prod.name);
    setDescription(prod.description);
    setCategory(prod.category);
    setPrice(prod.price);
    setStock(prod.stock);
    setSizeVariants(prod.size_variants ? prod.size_variants.join(', ') : '');
    setLength(prod.length || '');
    setWidth(prod.width || '');
    setHeight(prod.height || '');
    setWeight(prod.weight || '');
    setImages(prod.images ? [...prod.images] : []);
    setImageFiles([]);
    setStatus(prod.status);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this listing from your inventory?')) {
      await deleteProduct(id);
      loadProducts();
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + imageFiles.length + files.length > 5) {
      alert("You can only have up to 5 images in total.");
      return;
    }
    setImageFiles([...imageFiles, ...files]);
  };

  const handleRemoveExistingImage = (index) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
  };

  const handleRemoveNewFile = (index) => {
    const updated = imageFiles.filter((_, i) => i !== index);
    setImageFiles(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || price === '' || price === null || stock === '' || stock === null || weight === '' || length === '' || width === '' || height === '') {
      alert("Please fill out all required fields (Name, Price, Stock, Weight, Dimensions).");
      return;
    }

    if (images.length + imageFiles.length === 0) {
      alert('A product listing requires at least 1 image.');
      return;
    }

    setIsSaving(true);
    try {
      // Upload new files
      const uploadedUrls = [];
      for (const file of imageFiles) {
        const url = await uploadProductImage(file);
        uploadedUrls.push(url);
      }

      const finalImages = [...images, ...uploadedUrls];

      const payload = {
        name,
        description,
        category,
        price: parseFloat(price),
        stock: parseInt(stock),
        images: finalImages,
        status,
        size_variants: sizeVariants ? sizeVariants.split(',').map(s => s.trim()).filter(Boolean) : [],
        length: length ? parseFloat(length) : null,
        width: width ? parseFloat(width) : null,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null
      };

      if (editingProduct) {
        payload.id = editingProduct.id;
        payload.sales_count = editingProduct.salesCount;
      }

      await saveProduct(payload);
      await loadProducts();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Failed to save product.");
    } finally {
      setIsSaving(false);
    }
  };

  // Filtering Logic
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;

    let matchesStock = true;
    if (stockFilter === 'OutOfStock') matchesStock = p.stock === 0;
    else if (stockFilter === 'LowStock') matchesStock = p.stock > 0 && p.stock <= 5;
    else if (stockFilter === 'InStock') matchesStock = p.stock > 5;

    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <div className="inventory-screen">
      <div className="inventory-header">
        <div>
          <h2>My Product Listings</h2>
          <p>Manage and upload products that buyers can purchase.</p>
        </div>
        <button onClick={handleOpenAddModal} className="btn btn-primary">
          <Plus size={18} />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="card filters-card">
        <div className="filters-grid">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search product name or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-selects">
            <div className="filter-select-group">
              <label>Category</label>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="All">All Categories</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="filter-select-group">
              <label>Stock Status</label>
              <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
                <option value="All">All Stock Levels</option>
                <option value="InStock">In Stock (&gt;5 left)</option>
                <option value="LowStock">Low Stock (1-5 left)</option>
                <option value="OutOfStock">Out of Stock</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="card catalog-card">
        <div className="table-responsive">
          <table className="catalog-table">
            <thead>
              <tr>
                <th>Product Details</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock Level</th>
                <th>Sales Count</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingProducts ? (
                <SkeletonLoader type="table-row" count={5} />
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-catalog-row">
                    <Package size={48} className="empty-icon" />
                    <p>No listings matched your criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(prod => (
                  <tr key={prod.id}>
                    <td>
                      <div className="product-info-cell">
                        <img
                          src= {prod.images && prod.images[0]}
                          alt= {prod.name}
                          className="product-thumbnail"
                        />
                        <div className="product-info-text">
                          <span className="product-name">{prod.name}</span>
                          <span className="product-desc">{prod.description.substring(0, 50)}...</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="category-tag">{prod.category}</span>
                    </td>
                    <td className="product-price">₹{prod.price.toLocaleString('en-IN')}</td>
                    <td>
                      <div className="stock-level-cell">
                        <span className={`badge ${prod.stock === 0 ? 'badge-danger' :
                            prod.stock <= 5 ? 'badge-warning' : 'badge-success'
                          }`}>
                          {prod.stock === 0 ? 'Out of Stock' : `${prod.stock} units`}
                        </span>
                      </div>
                    </td>
                    <td className="product-sales">
                      <div className="sales-stats">
                        <TrendingUp size={14} className="sales-icon" />
                        <span>{prod.salesCount || 0} sold</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${prod.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                        {prod.status === 'active' ? <Eye size={12} style={{ marginRight: '4px' }} /> : <EyeOff size={12} style={{ marginRight: '4px' }} />}
                        {prod.status}
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button
                          onClick={() => handleOpenEditModal(prod)}
                          className="action-btn edit-btn"
                          title="Edit Listing"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(prod.id)}
                          className="action-btn delete-btn"
                          title="Delete Listing"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="modal-overlay">
            <motion.div
              className="modal-card"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="modal-header">
                <h3>{editingProduct ? 'Edit Product details' : 'List New Product'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="close-btn">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                  <label htmlFor="prod-name">Product Name *</label>
                  <input
                    type="text"
                    id="prod-name"
                    className="form-input"
                    placeholder="e.g. Lavender Herbal Soap"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-double-column">
                  <div className="form-group">
                    <label htmlFor="prod-category">Category *</label>
                    <select
                      id="prod-category"
                      className="form-input"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="prod-status">Visibility Status</label>
                    <select
                      id="prod-status"
                      className="form-input"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="active">Active (Visible to Buyers)</option>
                      <option value="draft">Draft (Private)</option>
                    </select>
                  </div>
                </div>

                <div className="form-double-column">
                  <div className="form-group">
                    <label htmlFor="prod-price">Retail Price (₹) *</label>
                    <input
                      type="number"
                      id="prod-price"
                      className="form-input"
                      placeholder="e.g. 350"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="prod-stock">Stock Quantity *</label>
                    <input
                      type="number"
                      id="prod-stock"
                      className="form-input"
                      placeholder="e.g. 20"
                      min="0"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="prod-desc">Product Description</label>
                  <textarea
                    id="prod-desc"
                    className="form-input text-area-input"
                    placeholder="Describe materials, sizing, fragrance details, and how it is made..."
                    rows="3"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></textarea>
                </div>

                <div className="form-group">
                  <label htmlFor="prod-size-variants">Size Variants</label>
                  <input
                    type="text"
                    id="prod-size-variants"
                    className="form-input"
                    placeholder="e.g. S, M, L, XL (comma separated)"
                    value={sizeVariants}
                    onChange={(e) => setSizeVariants(e.target.value)}
                  />
                </div>

                <h4 style={{ marginBottom: '10px', fontSize: '1rem', color: 'var(--text-primary)' }}>Logistics Details (India Post)</h4>
                <div className="form-double-column">
                  <div className="form-group">
                    <label htmlFor="prod-weight">Weight (g) *</label>
                    <input
                      type="number"
                      id="prod-weight"
                      className="form-input"
                      placeholder="e.g. 500"
                      min="0"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="prod-length">Length (cm) *</label>
                    <input
                      type="number"
                      id="prod-length"
                      className="form-input"
                      placeholder="e.g. 15"
                      min="0"
                      step="0.1"
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-double-column">
                  <div className="form-group">
                    <label htmlFor="prod-width">Width (cm) *</label>
                    <input
                      type="number"
                      id="prod-width"
                      className="form-input"
                      placeholder="e.g. 10"
                      min="0"
                      step="0.1"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="prod-height">Height (cm) *</label>
                    <input
                      type="number"
                      id="prod-height"
                      className="form-input"
                      placeholder="e.g. 5"
                      min="0"
                      step="0.1"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Product Images * <span className="label-subtitle">(Up to 5 images allowed)</span></label>

                  {/* Show existing images */}
                  {images.length > 0 && (
                    <div className="existing-images-preview" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
                      {images.map((url, idx) => (
                        <div key={idx} style={{ position: 'relative' }}>
                          <img src={url} alt={`Preview ${idx}`} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                          <button type="button" onClick={() => handleRemoveExistingImage(idx)} style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', borderRadius: '50%', border: 'none', cursor: 'pointer', width: '20px', height: '20px' }}>x</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Show new files to upload */}
                  {imageFiles.length > 0 && (
                    <div className="new-files-preview" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
                      {imageFiles.map((file, idx) => (
                        <div key={idx} style={{ position: 'relative' }}>
                          <img src={URL.createObjectURL(file)} alt={`New file ${idx}`} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '2px solid #4ade80' }} />
                          <button type="button" onClick={() => handleRemoveNewFile(idx)} style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', borderRadius: '50%', border: 'none', cursor: 'pointer', width: '20px', height: '20px' }}>x</button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="image-urls-list">
                    {images.length + imageFiles.length < 5 && (
                      <div className="image-input-row">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileChange}
                          className="form-input"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSaving}>
                    {isSaving ? 'Saving...' : editingProduct ? 'Save Changes' : 'Publish Product'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .inventory-screen {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .inventory-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border);
        }

        .inventory-header h2 {
          font-size: 1.75rem;
        }

        .inventory-header p {
          color: var(--text-secondary);
        }

        .filters-card {
          padding: 1.25rem 1.5rem;
        }

        .filters-grid {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          gap: 1.5rem;
        }

        .search-box {
          flex: 2;
          min-width: 280px;
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 14px;
          color: var(--text-secondary);
        }

        .search-box input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.75rem;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: 8px;
          outline: none;
          transition: var(--transition);
        }

        .search-box input:focus {
          border-color: var(--accent);
          background: var(--bg-secondary);
          box-shadow: 0 0 0 3px var(--accent-soft);
        }

        .filter-selects {
          flex: 3;
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .filter-select-group {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          min-width: 160px;
        }

        .filter-select-group label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
        }

        .filter-select-group select {
          padding: 0.7rem;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 500;
          outline: none;
          cursor: pointer;
        }

        .catalog-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .catalog-table th, 
        .catalog-table td {
          padding: 1.1rem;
          border-bottom: 1px solid var(--border);
          font-size: 0.9rem;
        }

        .catalog-table th {
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
        }

        .product-info-cell {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .product-thumbnail {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          object-fit: cover;
          border: 1px solid var(--border);
        }

        .product-info-text {
          display: flex;
          flex-direction: column;
        }

        .product-name {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 0.95rem;
        }

        .product-desc {
          font-size: 0.75rem;
          color: var(--text-secondary);
          max-width: 250px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .category-tag {
          font-size: 0.8rem;
          font-weight: 500;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
        }

        .product-price {
          font-weight: 700;
          font-family: 'Montserrat', sans-serif;
        }

        .sales-stats {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-weight: 600;
          color: var(--me-navy);
        }

        .sales-icon {
          color: var(--accent);
        }

        .actions-cell {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border);
        }

        .edit-btn {
          color: var(--me-navy);
          background: rgba(10, 46, 92, 0.05);
        }

        .edit-btn:hover {
          background: var(--me-navy);
          color: white;
        }

        .delete-btn {
          color: var(--danger);
          background: var(--danger-soft);
        }

        .delete-btn:hover {
          background: var(--danger);
          color: white;
        }

        .empty-catalog-row {
          text-align: center;
          padding: 4rem 0 !important;
          color: var(--text-secondary);
        }

        .empty-icon {
          opacity: 0.3;
          margin-bottom: 0.75rem;
          color: var(--text-primary);
        }

        /* Modal Overlay CSS */
        .modal-overlay {
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(70, 23, 17, 0.4);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1100;
          padding: 1.5rem;
        }

        .modal-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 20px;
          width: 100%;
          max-width: 600px;
          box-shadow: var(--shadow-hover);
          overflow: hidden;
        }

        .modal-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .close-btn {
          color: var(--text-secondary);
        }

        .close-btn:hover {
          color: var(--text-primary);
        }

        .modal-form {
          padding: 1.5rem;
        }

        .form-double-column {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        @media (max-width: 480px) {
          .form-double-column {
            grid-template-columns: 1fr;
            gap: 0;
          }
        }

        .text-area-input {
          resize: vertical;
          min-height: 80px;
        }

        .label-subtitle {
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-weight: 500;
          display: block;
          margin-top: 0.15rem;
        }

        .image-urls-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
          max-height: 220px;
          overflow-y: auto;
          padding: 0.75rem;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: 8px;
        }

        .image-input-row {
          display: flex;
          flex-direction: column;
        }

        .image-input-field-wrapper {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .image-input-index {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-primary);
          width: 65px;
          flex-shrink: 0;
        }

        .image-field-input-box {
          position: relative;
          display: flex;
          align-items: center;
          flex: 1;
        }

        .image-field-icon {
          position: absolute;
          left: 12px;
          color: var(--text-secondary);
        }

        .image-field-input-box .form-input-with-icon {
          padding-left: 2.5rem;
        }

        .remove-image-field-btn {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--danger-soft);
          color: var(--danger);
          border: 1px solid transparent;
        }

        .remove-image-field-btn:hover {
          background: var(--danger);
          color: white;
        }

        .add-image-field-btn {
          padding: 0.45rem 0.9rem;
          font-size: 0.8rem;
          border-radius: 6px;
          margin-top: 0.25rem;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1.5rem;
          padding-top: 1.25rem;
          border-top: 1px solid var(--border);
        }
      `}</style>
    </div>
  );
};

export default InventoryScreen;
