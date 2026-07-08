import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast = ({ message, type, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-5 left-4 right-4 z-[100] px-4 py-3 rounded-2xl shadow-lg text-sm font-medium flex items-center gap-3
        ${type === 'success'
          ? 'bg-forest text-white'
          : 'bg-red-600 text-white'
        }`}
    >
      <span>{type === 'success' ? '✅' : '❌'}</span>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="text-white/70 hover:text-white text-lg leading-none">×</button>
    </div>
  );
};

export default Toast;