import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FaClock, FaSearch, FaArrowLeft } from 'react-icons/fa';
import { useGetProductsQuery } from '../slices/productsApiSlice';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import ProductCard from '../components/ProductCard';
import { SkeletonCard } from '../components/Skeleton';

const NewestProducts = () => {
  const { rate = 1, currencyCode = 'USD' } = useSelector((state) => state.currency);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  const { data: products = [], isLoading, isError } = useGetProductsQuery({});

  const sortedProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return sortedProducts;
    const term = searchTerm.toLowerCase();
    return sortedProducts.filter(p =>
      p.name?.toLowerCase().includes(term) ||
      p.category?.toLowerCase().includes(term) ||
      p.brand?.toLowerCase().includes(term)
    );
  }, [sortedProducts, searchTerm]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="text-sm text-brand-orange-600 hover:text-orange-800 hover:underline flex items-center gap-1 mb-2">
            <FaArrowLeft size={12} /> Back to home
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <FaClock className="text-orange-600" />
                Newest Products
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Recently added products ({filteredProducts.length} total)
              </p>
            </div>
            <div className="relative w-full md:w-72">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search newest..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-orange-500 transition-all"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-sm font-bold">Failed to load products. Please try again.</div>
        ) : paginatedProducts.length === 0 ? (
          <EmptyState icon={FaClock} title="No products found" message={searchTerm ? 'Try a different search term' : 'No products available yet'} actionTo="/" actionLabel="Browse Products" />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {paginatedProducts.map((product) => (
                <ProductCard key={product._id} product={product} rate={rate} currencyCode={currencyCode} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  variant="secondary"
                  size="sm"
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    variant={currentPage === page ? 'primary' : 'secondary'}
                    size="sm"
                    className="w-10 h-10"
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  variant="secondary"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NewestProducts;
