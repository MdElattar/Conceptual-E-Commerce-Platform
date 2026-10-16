import Button from './Button';

const EmptyState = ({ icon: Icon, title, message, actionLabel, actionTo, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-zinc-100">
      {Icon && (
        <div className="w-16 h-16 bg-orange-50 rounded-xl flex items-center justify-center mb-4 border border-orange-100">
          <Icon className="text-orange-400" size={28} />
        </div>
      )}
      <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
      {message && <p className="text-gray-500 mb-6 text-sm text-center max-w-sm">{message}</p>}
      {actionTo && (
        <Button to={actionTo} variant="action" size="lg" className="rounded-full">
          {actionLabel || 'Browse Products'}
        </Button>
      )}
      {onAction && (
        <Button onClick={onAction} variant="action" size="lg" className="rounded-full">
          {actionLabel || 'Browse Products'}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
