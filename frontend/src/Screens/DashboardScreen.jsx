import { useState, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { FaBars, FaTimes } from 'react-icons/fa';
import { useRef } from 'react';

const DashboardScreen = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);

  if (prevPathRef.current !== location.pathname) {
    prevPathRef.current = location.pathname;
    setIsSidebarOpen(false);
  }

  const toggleSidebar = useCallback(() => setIsSidebarOpen(o => !o), []);

  return (
    <div className='flex flex-col md:flex-row min-h-screen bg-gray-50 relative'>

      {/* --- Mobile Header --- */}
      <div className='md:hidden sticky top-0 w-full flex-shrink-0 bg-[#111111]/95 backdrop-blur-md text-white p-4 flex justify-between items-center z-[60] shadow-md border-b border-gray-800/50'>
        <div className='flex flex-col'>
          <span className='font-black text-orange-500 italic uppercase tracking-widest text-sm leading-tight'>DK-TEC</span>
          <span className='text-[10px] text-gray-400 font-bold tracking-widest uppercase'>Control Panel</span>
        </div>
        <button 
          onClick={toggleSidebar} 
          className='text-gray-300 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all focus:outline-none active:scale-95'
        >
          {isSidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      </div>

      {/* --- Mobile Overlay --- */}
      {/* 🌟 FIX 1: تم رفع الطبقة لـ 9998 لتغطي على الـ Navbars الأساسية */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-[9998] md:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* --- السايد بار --- */}
      <aside className={`
        fixed md:sticky 
        top-0 
        /* 🌟 FIX 2: تم رفع الطبقة لـ 9999 في الموبايل فقط ليكون فوق الجميع، والديسكتوب يظل 10 */
        left-0 z-[9999] md:z-10 w-[280px] 
        h-screen 
        /* 🌟 FIX 3: توحيد اللون الأسود الصناعي */
        bg-[#111111] md:border-r border-gray-800/50 shadow-2xl md:shadow-none 
        transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0
      `}>
        <Sidebar setSidebarOpen={setIsSidebarOpen} />
      </aside>

      {/* --- المحتوى الرئيسي --- */}
      <main className='flex-1 p-4 sm:p-6 md:p-8 w-full transition-all duration-300'>
        <div className='max-w-7xl mx-auto'>
          <Outlet />
        </div>
      </main>

    </div>
  );
};

export default DashboardScreen;