import { FaLock, FaHome, FaArrowLeft } from 'react-icons/fa';
import Button from '../components/Button';

const AccessDenied = () => (
  <div className="min-h-screen bg-surface-muted flex items-center justify-center p-4">
    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-8 md:p-12 text-center max-w-md w-full">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <FaLock className="text-red-500" size={28} />
      </div>
      <h1 className="text-2xl font-black text-zinc-900 mb-2">Access Denied</h1>
      <p className="text-zinc-500 mb-6">You don't have permission to access this page. If you believe this is a mistake, please contact your administrator.</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button to="/" variant="action" size="lg">
          <FaHome size={14} /> Go Home
        </Button>
        <Button onClick={() => window.history.back()} variant="secondary" size="lg">
          <FaArrowLeft size={14} /> Go Back
        </Button>
      </div>
    </div>
  </div>
);
export default AccessDenied;
