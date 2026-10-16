import { useState } from 'react';
import { useGetInquiriesQuery, useUpdateInquiryMutation, useDeleteInquiryMutation } from '../slices/inquiriesApiSlice';
import { FaEnvelope, FaPhone,  FaClock, FaCheckCircle, FaTrash, FaSyncAlt, FaWhatsapp, FaInbox } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';
import Message from '../components/Message';

const InquiryListScreen = () => {
  const { data: inquiries, isLoading, error, refetch } = useGetInquiriesQuery();
  
  const [updateInquiry, { isLoading: isUpdating }] = useUpdateInquiryMutation();
  const [deleteInquiry, { isLoading: isDeleting }] = useDeleteInquiryMutation();

  // تريكة الفلترة الحية بحسب حالة الطلب
  const [currentFilter, setCurrentFilter] = useState('All');

  const deleteHandler = async (id) => {
    if (window.confirm('Are you absolutely sure you want to purge this record? ⚠️')) {
      try {
        await deleteInquiry(id).unwrap();
        toast.success('Inquiry record purged successfully');
        refetch();
      } catch (err) {
        toast.error(err?.data?.message || err.error || 'Purge failed');
      }
    }
  };

  const statusHandler = async (id, status) => {
    try {
      await updateInquiry({ id, status }).unwrap();
      toast.success(`Pipeline updated to [${status}] 🚀`);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err.error || 'Pipeline shift failed');
    }
  };

  // توليد الحروف الأولى لاسم العميل
  const getInitials = (fullName) => {
    if (!fullName) return 'C';
    return fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  // تصفية المصفوفة بناءً على التاب النشط
  const filteredInquiries = inquiries?.filter(inquiry => {
    if (currentFilter === 'All') return true;
    return inquiry.status === currentFilter;
  }) || [];

  // حساب أعداد الحالات للعدادات الذكية
  const getCount = (status) => {
    if (!inquiries) return 0;
    if (status === 'All') return inquiries.length;
    return inquiries.filter(i => i.status === status).length;
  };

  return (
    <div className="bg-gray-50/30 min-h-screen pt-24 md:pt-32 pb-10 md:pb-20 px-4 sm:px-6 lg:px-8 font-sans antialiased text-gray-900">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Action Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10 border-b border-gray-100 pb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tight">
              Inquiries <span className="text-orange-600">Console</span>
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
              Inbound Pipeline & Asset Information Requests
            </p>
          </div>
          
          <button 
            onClick={() => refetch()} 
            disabled={isLoading}
            className="w-full sm:w-auto bg-gray-900 text-white px-6 py-4 rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-orange-600 transition-all shadow-xl shadow-gray-900/5 hover:shadow-orange-600/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <FaSyncAlt className={isLoading ? 'animate-spin' : 'transition-transform group-hover:rotate-180'} size={11} /> 
            <span>{isLoading ? 'Syncing...' : 'Refresh Feed'}</span>
          </button>
        </div>

        {/* 💎 تريكة: شريط الفلترة الذكي لتقسيم العمليات (Status Console) */}
        <div className="flex flex-wrap gap-2 mb-8 bg-gray-100 p-1.5 rounded-2xl max-w-2xl">
          {['All', 'Pending', 'Contacted', 'Closed'].map((status) => (
            <button
              key={status}
              onClick={() => setCurrentFilter(status)}
              className={`flex-1 min-w-[90px] py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2
                ${currentFilter === status 
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50' 
                  : 'text-gray-400 hover:text-gray-700'
                }`}
            >
              <span>{status}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold
                ${currentFilter === status ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {getCount(status)}
              </span>
            </button>
          ))}
        </div>

        {/* Dynamic Display Interceptors */}
        {isLoading ? (
          <div className="py-20 flex justify-center"><Loader /></div>
        ) : error ? (
          <Message variant='danger'>{error?.data?.message || error.error}</Message>
        ) : filteredInquiries.length === 0 ? (
          /* شاطئ الفراغ النظيف المتناسق */
          <div className="bg-white rounded-[3rem] border border-gray-150 p-16 md:p-24 text-center shadow-xl shadow-gray-100/40 max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center text-gray-300 mx-auto mb-6">
              <FaInbox size={32} />
            </div>
            <h3 className="font-black text-xl uppercase italic text-gray-800">Clear Pipeline</h3>
            <p className="text-xs text-gray-400 font-medium mt-2 max-w-xs mx-auto leading-relaxed">
              No inquiries match your current status filter criteria. Database node is fully synced.
            </p>
          </div>
        ) : (
          /* Grid Stack Wrapper */
          <div className="space-y-6">
            {filteredInquiries.map((inquiry) => (
              <div 
                key={inquiry._id} 
                className="bg-white rounded-[2.5rem] border border-gray-150 p-6 md:p-8 shadow-md hover:shadow-xl shadow-gray-100/30 transition-all group relative overflow-hidden"
              >
                
                {/* 💎 تريكة: التحكم في الـ Status والأمان عبر الـ Controls العلوية */}
                <div className="absolute right-6 top-6 md:right-8 md:top-8 flex items-center gap-2 z-10">
                  <select 
                    value={inquiry.status}
                    onChange={(e) => statusHandler(inquiry._id, e.target.value)}
                    disabled={isUpdating}
                    className={`text-[10px] font-black uppercase px-4 py-2 rounded-xl border border-transparent shadow-inner focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer transition-all appearance-none pr-8 relative bg-no-repeat bg-[right_0.5rem_center]
                      ${inquiry.status === 'Pending' ? 'bg-orange-50 text-orange-600 focus:ring-orange-500' : 
                        inquiry.status === 'Contacted' ? 'bg-blue-50 text-blue-600 focus:ring-blue-500' : 
                        'bg-green-50 text-green-600 focus:ring-green-500'}`}
                    style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundSize: '0.6rem' }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Closed">Closed</option>
                  </select>

                  {/* زر المسح المنعزل في كبسولة الأمان */}
                  <button 
                    onClick={() => deleteHandler(inquiry._id)}
                    disabled={isDeleting}
                    className="text-gray-300 hover:text-red-600 p-2.5 bg-gray-50 hover:bg-red-50 border border-gray-200/60 rounded-xl transition-all active:scale-95 disabled:opacity-40"
                    title="Purge Record"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>

                {/* Main Component Layout */}
                <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
                  
                  {/* Left Column: Lead Information Matrix */}
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center gap-4">
                      {/* 💎 تريكة: الـ Avatar يتناسق لونه حوافه مع حالة الكارت الفورية */}
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xs font-black shadow-inner shrink-0 border-2 transition-all duration-300
                        ${inquiry.status === 'Pending' ? 'bg-orange-50 text-orange-600 border-orange-200' : 
                          inquiry.status === 'Contacted' ? 'bg-blue-50 text-blue-600 border-blue-200' : 
                          'bg-green-50 text-green-600 border-green-200'}`}>
                        {getInitials(inquiry.name)}
                      </div>
                      <div>
                        <h3 className="font-black text-xl text-gray-900 tracking-tight leading-snug">{inquiry.name}</h3>
                        <div className="flex items-center gap-1.5 mt-1 text-orange-600 font-extrabold text-[10px] uppercase tracking-wider">
                          <FaCheckCircle size={10} /> 
                          <span>Target: {inquiry.productTitle}</span>
                        </div>
                      </div>
                    </div>

                    {/* أزرار الاتصال والمصفوفة السريعة العابرة للمنصات */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <a 
                        href={`mailto:${inquiry.email}`} 
                        className="flex items-center gap-2 text-gray-500 bg-gray-50 hover:bg-white border border-gray-200/60 hover:border-gray-300 px-3 py-2 rounded-xl transition-all font-bold text-xs"
                      >
                        <FaEnvelope className="text-gray-400" size={11} /> 
                        <span className="font-mono">{inquiry.email}</span>
                      </a>
                      
                      {inquiry.phone && inquiry.phone !== 'N/A' && (
                        <>
                          <a 
                            href={`tel:${inquiry.phone}`} 
                            className="flex items-center gap-2 text-gray-500 bg-gray-50 hover:bg-white border border-gray-200/60 hover:border-gray-300 px-3 py-2 rounded-xl transition-all font-bold text-xs"
                          >
                            <FaPhone className="text-gray-400" size={10} /> 
                            <span className="font-mono">{inquiry.phone}</span>
                          </a>
                          
                          {/* 💎 تريكة ممتازة: زر تواصل مباشر عبر واتساب لتسريع الـ Follow-up */}
                          <a 
                            href={`https://wa.me/${inquiry.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer" 
                            className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl transition-all font-bold text-xs"
                          >
                            {/* <FaWhitespace className="hidden" /> */}
                            <FaWhatsapp size={12} /> 
                            <span>WhatsApp</span>
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Transmission Text Bubble */}
                  <div className="flex-[1.6] bg-gray-50/60 border border-gray-100 p-6 rounded-[2rem] relative transition-colors group-hover:bg-orange-50/20 flex flex-col justify-between gap-4">
                    <p className="text-gray-700 font-medium leading-relaxed italic text-base">
                      "{inquiry.message}"
                    </p>
                    
                    <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5 border-t border-gray-100 pt-3">
                      <FaClock size={10} strokeWidth={1} /> 
                      <span>Ingested Gateway: {new Date(inquiry.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InquiryListScreen;