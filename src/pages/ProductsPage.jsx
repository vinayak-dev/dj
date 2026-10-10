import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { productsService } from '../services/productsService'
import AppLayout from '../components/layout/AppLayout'
import Header from '../components/layout/Header'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'
import { Plus, X, Pencil, Trash2, Package, List, LayoutGrid } from 'lucide-react'

export default function ProductsPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [form, setForm] = useState({ name: '', price: '', category: '' })
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) loadProducts()
  }, [user])

  async function loadProducts() {
    setLoading(true)
    try {
      const data = await productsService.getAll(user.id)
      setProducts(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function openAdd() {
    setEditProduct(null)
    setForm({ name: '', price: '', category: '' })
    setFormErrors({})
    setShowForm(true)
  }

  function openEdit(product) {
    setEditProduct(product)
    setForm({ name: product.name, price: product.price, category: product.category || '' })
    setFormErrors({})
    setShowForm(true)
  }

  function validate() {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.price || Number(form.price) < 0) errs.price = 'Valid price is required'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setFormErrors(errs); return }
    setSaving(true)
    try {
      if (editProduct) {
        const updated = await productsService.update(editProduct.id, {
          name: form.name.trim(),
          price: Number(form.price),
          category: form.category.trim() || null,
        })
        setProducts(prev => prev.map(p => p.id === updated.id ? updated : p))
      } else {
        const created = await productsService.create(user.id, {
          name: form.name.trim(),
          price: Number(form.price),
          category: form.category.trim() || null,
        })
        setProducts(prev => [created, ...prev])
      }
      setShowForm(false)
    } catch (err) {
      setFormErrors({ submit: err.message })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this product?')) return
    try {
      await productsService.delete(id)
      setProducts(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      alert('Failed to delete: ' + err.message)
    }
  }

  const [categoryFilter, setCategoryFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [view, setView] = useState('list') // default 'list' | 'grid'

  const categories = ['All', 'Thali & Dinner Sets', 'Kids Lunch Box & School Sets', 'Wallets & Gift Combos', 'Rakhi Collection']

  const filteredProducts = products.filter(p => {
    const matchesCat = categoryFilter === 'All' || p.category === categoryFilter
    const matchesSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase())
    return matchesCat && matchesSearch
  })

  return (
    <AppLayout>
      <Header
        title="Products & Catalog"
        subtitle={`${filteredProducts.length} items · Dj Arts & Crafts`}
        actions={
          <Button size="sm" onClick={openAdd}>
            <Plus size={14} /> Add product
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Category Pills, Search & View Switcher */}
        <div className="flex items-center justify-between gap-3 flex-wrap bg-white p-3 rounded-xl border border-gray-100 shadow-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search products or descriptions..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-gray-400"
              />
            </div>

            {/* List vs Grid View Toggle */}
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-0.5 bg-gray-50/50">
              <button
                onClick={() => setView('list')}
                title="List view"
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-colors ${
                  view === 'list' ? 'bg-gray-900 text-white shadow-xs' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <List size={13} /> List
              </button>
              <button
                onClick={() => setView('grid')}
                title="Grid cards"
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-colors ${
                  view === 'grid' ? 'bg-gray-900 text-white shadow-xs' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <LayoutGrid size={13} /> Grid
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : error ? (
          <div className="text-red-500 text-sm text-center py-20">{error}</div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Package size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No products match this filter</p>
            <p className="text-xs mt-1">Try switching categories or clearing search.</p>
          </div>
        ) : view === 'list' ? (
          /* Table List View */
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/75 border-b border-gray-100">
                  <tr>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Product Name</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Category</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3 min-w-[240px]">Description</th>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Regular Price</th>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Sale Price</th>
                    <th className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Offer</th>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredProducts.map(product => {
                    const discount = product.regular_price && product.regular_price > product.price
                      ? Math.round(((product.regular_price - product.price) / product.regular_price) * 100)
                      : null

                    return (
                      <tr key={product.id} className="hover:bg-gray-50/75 transition-colors group">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                              <Package size={15} />
                            </div>
                            <span className="font-semibold text-gray-900 text-xs">
                              {product.name}
                            </span>
                          </div>
                        </td>

                        <td className="px-3 py-3.5">
                          {product.category ? (
                            <span className="inline-block text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                              {product.category}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>

                        <td className="px-3 py-3.5 text-xs text-gray-500 max-w-sm">
                          <p className="line-clamp-2 leading-relaxed">
                            {product.description || '—'}
                          </p>
                        </td>

                        <td className="px-3 py-3.5 text-right text-xs text-gray-400 line-through whitespace-nowrap">
                          {product.regular_price ? `₹${Number(product.regular_price).toLocaleString('en-IN')}` : '—'}
                        </td>

                        <td className="px-3 py-3.5 text-right font-bold text-xs text-gray-900 whitespace-nowrap">
                          ₹{Number(product.price).toLocaleString('en-IN')}
                        </td>

                        <td className="px-3 py-3.5 text-center whitespace-nowrap">
                          {discount ? (
                            <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-full inline-block">
                              {discount}% OFF
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(product)}
                              title="Edit product"
                              className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              title="Delete product"
                              className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Grid Card View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => {
              const discount = product.regular_price && product.regular_price > product.price
                ? Math.round(((product.regular_price - product.price) / product.regular_price) * 100)
                : null

              return (
                <div key={product.id} className="bg-white border border-gray-100 rounded-xl p-4.5 hover:shadow-md transition-all group flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                        <Package size={17} />
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {discount && (
                          <span className="text-[10px] font-bold bg-red-50 text-red-600 px-1.5 py-0.5 rounded">
                            {discount}% OFF
                          </span>
                        )}
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                          <button onClick={() => openEdit(product)} className="w-6 h-6 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700">
                            <Pencil size={12} />
                          </button>
                          <button onClick={() => handleDelete(product.id)} className="w-6 h-6 rounded-md hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <p className="font-semibold text-gray-900 text-sm mt-3 line-clamp-2 leading-snug">
                      {product.name}
                    </p>
                    
                    {product.category && (
                      <span className="inline-block text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1.5">
                        {product.category}
                      </span>
                    )}

                    {product.description && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-3 leading-relaxed">
                        {product.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-50 flex items-baseline justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-bold text-gray-900">
                        ₹{Number(product.price).toLocaleString('en-IN')}
                      </span>
                      {product.regular_price && (
                        <span className="text-xs text-gray-400 line-through">
                          ₹{Number(product.regular_price).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={e => { if (e.currentTarget === e.target) setShowForm(false) }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">
                {editProduct ? 'Edit product' : 'Add product'}
              </h2>
              <button onClick={() => setShowForm(false)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4" noValidate>
              {formErrors.submit && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formErrors.submit}</p>
              )}
              <Input label="Product / Service name" required placeholder="Product name"
                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                error={formErrors.name} />
              <Input label="Price (₹)" required type="number" min="0" placeholder="Price"
                value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                error={formErrors.price} />
              <Input label="Category (optional)" placeholder="Category"
                value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} />
              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" variant="primary" loading={saving}>
                  {editProduct ? 'Save changes' : 'Add product'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
