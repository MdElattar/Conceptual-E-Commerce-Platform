import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaPlus, FaBoxOpen, FaBalanceScale, FaSearch } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import Button from '../components/Button';
import { 
  useGetProductsQuery, 
  useDeleteProductMutation 
} from '../slices/productsApiSlice';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    const { data: products, isLoading, error, refetch } = useGetProductsQuery();
    const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();

    // 🔴 تريكة: جلب بيانات العملة المحددة من الـ Redux لمنع تضارب الحسابات مع الـ Navbar
    const { 
      currencyCode = 'USD', 
      rate = 1, 
      symbol = '$' 
    } = useSelector((state) => state.currency);

    const deleteHandler = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await deleteProduct(id).unwrap();
                toast.success('Product deleted successfully');
                refetch();
            } catch (err) {
                toast.error(err?.data?.message || err.error);
            }
        }
    };

    // 🔴 تريكة: فلترة فورية داخل الجدول Client-Side لسرعة استجابة فائقة أثناء البحث
    const filteredProducts = products?.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product._id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto min-h-screen antialiased bg-gray-50/30">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-10">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-gray-900 uppercase">
                        Product <span className="text-orange-600 italic">Inventory</span>
                    </h1>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">
                        Control your store stock and listings
                    </p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                    {/* تريكة شريط البحث الفوري المدمج */}
                    <div className="relative flex-1 sm:w-64">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                        <input 
                            type="text"
                            placeholder="Search inventory..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-gray-200 pl-10 pr-4 py-2.5 rounded-xl text-xs font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors shadow-sm"
                        />
                    </div>
                    
                    <Button
                        variant="primary"
                        onClick={() => navigate('/admin/product/create')}
                    >
                        <FaPlus size={10} /> ADD NEW PRODUCT
                    </Button>
                </div>
            </div>

            {/* Content Section */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse"></div>
                    ))}
                </div>
            ) : error ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl font-bold text-sm border border-red-100">
                    Error loading products: {error?.data?.message || 'Check your connection'}
                </div>
            ) : (
                <div className="bg-white shadow-xl shadow-gray-100 rounded-2xl overflow-hidden border border-gray-150">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Preview</th>
                                    <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Details</th>
                                    <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                                    <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Weight</th>
                                    <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Price</th>
                                    <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredProducts?.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-20 text-center">
                                            <FaBoxOpen size={40} className="mx-auto text-gray-200 mb-4" />
                                            <p className="text-gray-400 font-bold text-xs uppercase">No matches found in inventory</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map((product) => {
                                        // احتساب السعر المضرب بالـ Rate الحالي
                                        const calculatedPrice = (product.price || 0) * rate;

                                        return (
                                            <tr key={product._id} className="hover:bg-gray-50/40 transition-colors group">
                                                <td className="p-5">
                                                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                                                        <img 
                                                            src={product.image} 
                                                            alt={product.name} 
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=No+Image'; }}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <p className="font-bold text-gray-900 text-sm">{product.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-mono mt-1">ID: {product._id.slice(-6).toUpperCase()}</p>
                                                </td>
                                                <td className="p-5">
                                                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                                                        {product.category}
                                                    </span>
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex items-center gap-1 text-gray-500 font-bold text-xs">
                                                        <FaBalanceScale className="text-orange-600/50" />
                                                        <span className="font-mono">{product.weight || 0}</span> <span className="text-[10px]">KG</span>
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    {/* تريكة السعر المتجاوب مع العملات الإنجليزية بدقة */}
                                                    <p className="font-black text-gray-900 text-sm font-mono flex items-center gap-1">
                                                        <span className="text-[11px] text-orange-600 font-sans font-bold">{symbol}</span>
                                                        <span>{calculatedPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                                    </p>
                                                </td>
                                                <td className="p-5">
                                                    {/* تريكة الأزرار الشفافة الذكية التفاعل */}
                                                    <div className="flex justify-center gap-2 md:opacity-30 group-hover:opacity-100 transition-opacity duration-200">
                                                        <button
                                                            onClick={() => navigate(`/admin/product/${product._id}/edit`)}
                                                            className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all"
                                                            title="Edit Product"
                                                        >
                                                            <FaEdit size={13} />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteHandler(product._id)}
                                                            disabled={isDeleting}
                                                            className="p-2.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all disabled:opacity-50"
                                                            title="Delete Product"
                                                        >
                                                            <FaTrash size={13} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Footer Stats */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Products</p>
                    <p className="text-2xl font-black text-gray-900 mt-1 font-mono">{products?.length || 0}</p>
                </div>
                
                <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Stock Weight</p>
                    <p className="text-2xl font-black text-gray-900 mt-1 font-mono">
                        {products?.reduce((acc, item) => acc + ((item.weight || 0) * (item.countInStock || 0)), 0).toLocaleString('en-US')} <span className="text-xs text-gray-400 font-sans">KG</span>
                    </p>
                </div>
                
                <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inventory Value</p>
                    {/* تريكة: حساب القيمة الكلية وضخها بالعملة المحددة واللوكل الإنجليزي الحازم */}
                    <p className="text-2xl font-black text-orange-600 mt-1 font-mono flex items-center gap-1">
                        <span className="text-sm font-sans font-bold">{symbol}</span>
                        <span>
                            {products?.reduce((acc, item) => acc + ((item.price * rate) * (item.countInStock || 0)), 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;