import { useEffect } from 'react';

export default function NotificationModal({ message, type, onClose, onConfirm }) {
  if (!message) return null;

  const isSuccess = type === 'success';
  const isError = type === 'error';
  const isConfirm = type === 'confirm';

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const color = isSuccess ? '#10B981' : isError ? '#EF4444' : '#3B82F6';

  return (
    <div className="nmodal-overlay" onClick={onClose}>
      <div className="nmodal" onClick={e => e.stopPropagation()} style={{ '--ncolor': color }}>
        <div className="nmodal-orbit-wrap">
          <div className="nmodal-orbit-center">
            <div className="nmodal-center-icon">
              {isSuccess ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : isError ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              )}
            </div>
          </div>
          <div className="nmodal-ring nmodal-ring-1" style={{ borderTopColor: color, borderRightColor: color + '60' }} />
          <div className="nmodal-ring nmodal-ring-2" style={{ borderTopColor: color, borderLeftColor: color + '40' }} />
          <div className="nmodal-ring nmodal-ring-3" style={{ borderTopColor: color, borderRightColor: color + '30' }} />
        </div>
        <p className="nmodal-message">{message}</p>
        <div className="nmodal-actions">
          {isConfirm ? (
            <>
              <button className="nmodal-btn nmodal-btn-cancel" onClick={() => onConfirm(false)}>Batal</button>
              <button className="nmodal-btn nmodal-btn-confirm" onClick={() => onConfirm(true)}>Ya, Hapus</button>
            </>
          ) : (
            <button className="nmodal-btn nmodal-btn-ok" onClick={onClose}>Tutup</button>
          )}
        </div>
      </div>
    </div>
  );
}
