import { ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ToastProvider = () => {
  return (
    <ToastContainer
      position="top-center"
      autoClose={4000}
      hideProgressBar={true}
      newestOnTop={true}
      closeButton={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss={false}
      draggable
      pauseOnHover
      transition={Slide}
      toastClassName={() => "relative text-black flex p-4 min-h-[60px] rounded-[1.25rem] justify-between overflow-hidden cursor-pointer bg-white/95 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100/80 mb-3 mt-4 mx-4 sm:mx-auto max-w-sm transition-all duration-300 transform"}
      bodyClassName={() => "flex w-full m-0 p-0 text-black font-sans"}
      style={{ zIndex: 999999 }}
    />
  );
};

export default ToastProvider;
