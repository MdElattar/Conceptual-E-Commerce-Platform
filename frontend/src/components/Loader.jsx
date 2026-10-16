import React from 'react';
import { FaCog } from 'react-icons/fa';

const Loader = () => {
  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0D1527]/90 backdrop-blur-md select-none pointer-events-auto">
      
      {/* حقن أنميشن المصانع الميكانيكي داخل المكون ليعمل فوراً */}
      <style>{`
        @keyframes gear-clockwise {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes gear-counter {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes hud-pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.98); }
          50% { opacity: 1; transform: scale(1.02); }
        }
        .animate-gear-main { animation: gear-clockwise 8s linear infinite; }
        .animate-gear-sub { animation: gear-counter 4s linear infinite; }
        .animate-hud-ring { animation: gear-clockwise 12s tracking infinite; }
        .animate-text-heavy { animation: hud-pulse 2s ease-in-out infinite; }
      `}</style>

      <div className="relative flex flex-col items-center justify-center gap-8 scale-90 sm:scale-100">
        
        {/* الحاوية الأساسية للمحرك الميكانيكي */}
        <div className="relative w-40 h-40 flex items-center justify-center">
          
          {/* الحلقة الليزرية الخارجية (HUD Ring) */}
          <svg className="absolute w-full h-full text-gray-800/40 animate-spin" style={{ animationDuration: '20s' }} viewBox="0 0 100 100">
            <circle 
              cx="50" 
              cy="50" 
              r="46" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeDasharray="6 8 30 10"
            />
          </svg>

          {/* الترس الرئيسي (الكبير الداكن) - يمثل القوة والاستقرار */}
          <div className="absolute -translate-x-3 -translate-y-3">
            <FaCog 
              className="text-slate-800 animate-gear-main filter drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]" 
              size={110} 
            />
          </div>
          
          {/* الترس الفرعي المتداخل (البرتقالي الميكانيكي) - بيلف عكسي ومتشابك الأسنان */}
          <div className="absolute translate-x-10 translate-y-8">
            <FaCog 
              className="text-[#FF6B00] animate-gear-sub filter drop-shadow-[0_0_20px_rgba(255,107,0,0.35)]" 
              size={65} 
            />
          </div>

          {/* نقطة الارتكاز المركزية للشبكة الهندسية */}
          <div className="absolute w-2 h-2 bg-[#0D1527] border-2 border-[#FF6B00] rounded-full z-10"></div>
        </div>

        {/* لوحة نصوص التحميل والتهيئة الفاخرة */}
        <div className="text-center space-y-1.5 animate-text-heavy">
          <h2 className="text-white text-sm font-black tracking-[0.4em] uppercase m-0 pl-[0.4em]">
            Initializing Node
          </h2>
          <p className="text-[#FF6B00] text-[9px] font-black tracking-[0.25em] uppercase opacity-85 m-0 pl-[0.25em]">
            Configuring DKTEC Logistics 🔒
          </p>
        </div>
        
      </div>
    </div>
  );
};

export default Loader;