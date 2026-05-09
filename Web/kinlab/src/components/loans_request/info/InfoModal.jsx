import React from 'react';
import PropTypes from 'prop-types';

function InfoModal({ isOpen, onClose, title = 'Detalles', items = [] }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-center">{title}</h2>
        <hr className="mb-4" />
        <div className="space-y-3">
          {items.map((it, idx) => (
            <div key={idx} className="flex">
              <span className="font-semibold mr-2">{it.label}:</span>
              <span className="text-gray-800 break-words">{it.value}</span>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-gray-600">Sin información para mostrar.</div>
          )}
        </div>
        <div className="mt-6 flex justify-center">
          <button onClick={onClose} className="px-5 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-500">Cerrar</button>
        </div>
      </div>
    </div>
  );
}

InfoModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,        // Control si se muestra o no
  onClose: PropTypes.func.isRequired,       // Función para cerrar
  title: PropTypes.string,                  // Título opcional
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,   // Nombre del campo
      value: PropTypes.oneOfType([          // Valor del campo
        PropTypes.string,
        PropTypes.number,
        PropTypes.bool,
        PropTypes.node
      ]).isRequired
    })
  )                                          // Lista de items
};

export default InfoModal;
