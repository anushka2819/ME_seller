import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, AlertTriangle, Info } from 'lucide-react';

/**
 * Reusable Toast Notification Component
 * Usage: <Toast message="..." type="success|error|warning|info" onClose={fn} />
 */
const Toast = ({ message, type = 'success', onClose }) => {
  const icons = {
    success: <CheckCircle size={18} />,
    error: <AlertTriangle size={18} />,
    warning: <AlertTriangle size={18} />,
    info: <Info size={18} />,
  };

  const colors = {
    success: { bg: 'rgba(16, 185, 129, 0.12)', border: '#10B981', icon: '#10B981' },
    error:   { bg: 'rgba(239, 68, 68, 0.12)',  border: '#EF4444', icon: '#EF4444' },
    warning: { bg: 'rgba(245, 158, 11, 0.12)', border: '#F59E0B', icon: '#F59E0B' },
    info:    { bg: 'rgba(10, 46, 92, 0.12)',   border: '#0a2e5c', icon: '#0a2e5c' },
  };

  const style = colors[type] || colors.success;

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key="toast"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            background: 'var(--bg-secondary)',
            border: `1px solid ${style.border}`,
            borderRadius: '14px',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            boxShadow: '0 12px 36px rgba(0,0,0,0.15)',
            zIndex: 1200,
            maxWidth: '420px',
            minWidth: '280px',
          }}
        >
          <span style={{ color: style.icon, display: 'flex', flexShrink: 0 }}>
            {icons[type]}
          </span>
          <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)', flex: 1, lineHeight: 1.4 }}>
            {message}
          </span>
          <button
            onClick={onClose}
            style={{ color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', flexShrink: 0, background: 'none', border: 'none' }}
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Hook to manage toast state
 * Usage: const { toast, showToast } = useToast();
 * Show: showToast('Message', 'success')
 * Render: <Toast {...toast} onClose={() => showToast('')} />
 */
export const useToast = () => {
  const [toast, setToast] = React.useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success', duration = 4000) => {
    setToast({ message, type });
    if (message && duration > 0) {
      setTimeout(() => setToast({ message: '', type: 'success' }), duration);
    }
  };

  return { toast, showToast };
};

export default Toast;
