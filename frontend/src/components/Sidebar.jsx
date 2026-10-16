import { useLocation } from 'react-router-dom'; 
import { ListGroup } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { FaUser, FaClipboardList, FaTachometerAlt } from 'react-icons/fa';

const Sidebar = ({ setSidebarOpen }) => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className='p-6 h-full flex flex-col overflow-y-auto custom-scrollbar bg-[#111111]'>
      
      {/* Header */}
      <div className='mb-8 pt-4 border-b border-gray-800/80 pb-6 mt-4 md:mt-8'>
        <a href='/' className='text-orange-500 font-black text-2xl flex items-center mb-1 hover:text-orange-400 transition-colors uppercase italic tracking-widest'>
          <FaTachometerAlt className='me-3 drop-shadow-md' /> DK-TEC 
        </a>
        <small className='text-gray-500 text-[10px] font-bold tracking-[0.2em] uppercase ps-9 block'>
           Control Panel
        </small>
      </div>

      <ListGroup variant='flush' className='bg-transparent flex-grow space-y-2'>
        <LinkContainer 
          to='/profile' 
          style={{ cursor: 'pointer' }}
          onClick={() => {
            if (setSidebarOpen) setSidebarOpen(false);
          }}
        >
          <ListGroup.Item 
            as="div" 
            className={`border-0 mb-2 p-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center group shadow-md relative overflow-hidden
              ${isActive('/profile') 
                ? 'bg-gray-900 text-white translate-x-2 border-l-4 border-orange-500' 
                : 'bg-transparent text-gray-400 hover:bg-gray-800 hover:text-white hover:translate-x-2'
              }
            `}
          >
            <FaUser className={`me-3 transition-colors scale-110 ${isActive('/profile') ? 'text-orange-500' : 'text-gray-400 group-hover:text-orange-500'}`} size={18} /> 
            <span className="relative z-10">Account Settings</span>
          </ListGroup.Item>
        </LinkContainer>

        {/* <LinkContainer 
          to='/my-orders' 
          style={{ cursor: 'pointer' }}
          onClick={() => {
            if (setSidebarOpen) setSidebarOpen(false);
          }}
        >
          <ListGroup.Item 
            as="div" 
            className={`border-0 mb-2 p-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center group shadow-md relative overflow-hidden
              ${isActive('/my-orders') 
                ? 'bg-gray-900 text-white translate-x-2 border-l-4 border-orange-500' 
                : 'bg-transparent text-gray-400 hover:bg-gray-800/50 hover:text-white hover:translate-x-2'
              }
            `}
          >
            <FaClipboardList className={`me-3 transition-colors scale-110 ${isActive('/my-orders') ? 'text-orange-500' : 'text-gray-500 group-hover:text-orange-500'}`} size={18} /> 
            <span className="relative z-10">My Bookings</span>
          </ListGroup.Item>
        </LinkContainer> */}
      </ListGroup>
      
      {/* 🌟 System Online Indicator */}
      <div className='mt-auto pt-6 border-t border-gray-800/80'>
        <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-center gap-3 cursor-default hover:bg-emerald-900/20 transition-colors">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.9)]"></div>
          <span className="text-[9px] font-black uppercase text-emerald-500 tracking-[0.2em]">System Online</span>
        </div>
      </div>

    </div>
  );
};

export default Sidebar;