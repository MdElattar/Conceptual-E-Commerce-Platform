// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const LoaderOverlay = ({ message = "Securing your transaction..." }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/80 backdrop-blur-md"
    >
      {/* Spinner احترافي باللون الأسود والبرتقالي */}
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gray-100 border-t-orange-600 rounded-full animate-spin"></div>
        <div className="absolute w-8 h-8 border-4 border-gray-100 border-b-black rounded-full animate-spin-slow"></div>
      </div>
      
      <motion.p 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-6 text-sm font-black tracking-widest text-black uppercase italic"
      >
        {message}
      </motion.p>
      
      <p className="mt-2 text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
        Please do not refresh or close this window
      </p>
    </motion.div>
  );
};

export default LoaderOverlay;