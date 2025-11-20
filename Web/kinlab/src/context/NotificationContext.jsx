import React, { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { MdOutlinePanoramaPhotosphereSelect } from 'react-icons/md';

const NotificationContext = createContext({ notify: () => {} });

const bannerClassFor = (type) => {
  // Paleta suave con Tailwind (fondos claros, texto oscuro, borde sutil)
  switch (type) {
    case 'success':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'error':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'warning':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'info':
    default:
      return 'bg-blue-100 text-blue-800 border-blue-300';
  }
};

export const NotificationProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  const remove = useCallback((id) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notify = useCallback(({ type = 'info', message, timeout = 3000 }) => {
    if (!message) return;
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, type, message }]);
    if (timeout && timeout > 0) {
      setTimeout(() => remove(id), timeout);
    }
  }, [remove]);

  // También escuchar eventos globales 'notify' para compatibilidad
  React.useEffect(() => {
    const handler = (e) => {
      const detail = e.detail || {};
      notify({ type: detail.type || 'info', message: detail.message || '', timeout: detail.timeout ?? 3000 });
    };
    globalThis.addEventListener('notify', handler);
    return () => globalThis.removeEventListener('notify', handler);
  }, [notify]);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <div className="fixed top-4 left-0 right-0 z-[9999] flex flex-col items-center gap-2 pointer-events-none">
        {items.map((n) => (
          <div
            key={n.id}
            className={
              `pointer-events-auto max-w-xl w-[92%] rounded-md shadow-sm px-4 py-3 border ${bannerClassFor(n.type)}`
            }
          >
            <div className="flex justify-between items-start">
              <span className="text-[0.75rem] leading-tight">{n.message}</span>
              <button
                aria-label="Cerrar notificación"
                className="ml-4 text-gray-600 hover:text-gray-800"
                onClick={() => remove(n.id)}
              >
                
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useNotification = () => useContext(NotificationContext);