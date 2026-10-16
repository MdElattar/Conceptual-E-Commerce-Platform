import { FaExclamationCircle } from 'react-icons/fa';
import Button from './Button';

const ErrorDisplay = ({ message, onRetry, variant = 'danger' }) => {
  const bgMap = {
    danger: 'bg-red-50 border-red-200 text-red-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  };

  return (
    <div className={`${bgMap[variant] || bgMap.danger} border px-6 py-4 rounded-xl text-sm font-bold flex items-center gap-3`}>
      <FaExclamationCircle className="shrink-0" size={16} />
      <span className="flex-1">{message || 'Something went wrong.'}</span>
      {onRetry && (
        <Button onClick={onRetry} variant="primary" size="sm" className="ml-auto">
          Try again
        </Button>
      )}
    </div>
  );
};

export default ErrorDisplay;
