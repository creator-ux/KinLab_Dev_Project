import React, { useEffect, useState } from 'react';
import { api } from '../../../apiClient.js';
import PropTypes from 'prop-types';
import { useNotification } from '../../../context/NotificationContext.jsx';

function AddArea({ onClose, onAreaAdded }) {
  const [nombre_laboratorio, setNombreLaboratorio] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [selectedEncargadoId, setSelectedEncargadoId] = useState(''); // string para <select>
  const { notify } = useNotification();

  // Cargar lista de usuarios (encargados potenciales)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await api.get('/api/users');
        if (!mounted) return;
        setUsuarios(Array.isArray(data) ? data : []);
      } catch (e) {
        // Si falla, seguimos permitiendo crear sin encargado
        if (!mounted) return;
        setUsuarios([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleCreate = async () => {
    try {
      await api.post('/api/laboratory', { 
        nombre_laboratorio,
        id_usuario_encargado: selectedEncargadoId ? Number(selectedEncargadoId) : null,
      });

      globalThis.dispatchEvent(new CustomEvent('area-updated'));
      notify({
        type: 'success',
        message: selectedEncargadoId
          ? `"${nombre_laboratorio}" creado y encargado asignado.`
          : `"${nombre_laboratorio}" creado sin encargado.`,
      });
      onAreaAdded();

    } catch (err) {
      console.error("Error al crear el área:", err);
      setError(err.message || "No se pudo crear el área. Intente de nuevo.");
      notify({ type: 'error', message: err.message || 'Error al crear el laboratorio.' });
      setIsLoading(false);
    }
    
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    await handleCreate(); 
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl z-50 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Nuevo Área</h2>

        <form onSubmit={handleSubmit}>
          {/* Campo de nombre del laboratorio */}
          <div className="mb-4">
            <label
              htmlFor="nombre"
              className="block text-sm font-medium text-gray-700"
            >
              Nombre del Laboratorio
            </label>
            <input
              type="text"
              id="nombre"
              value={nombre_laboratorio}
              onChange={(e) => setNombreLaboratorio(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              placeholder="Ej. Laboratorio de Electrónica"
              required
            />
          </div>

          {/* Selector de encargado (opcional) */}
          <div className="mb-4">
            <label htmlFor="encargado" className="block text-sm font-medium text-gray-700">
              Nombre del Encargado (opcional)
            </label>
            <select
              id="encargado"
              value={selectedEncargadoId}
              onChange={(e) => setSelectedEncargadoId(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white"
            >
              <option value="">Sin encargado</option>
              {usuarios.map((u) => {
                const full = [u?.nombre, u?.apellido_paterno, u?.apellido_materno]
                  .filter(Boolean)
                  .join(' ');
                return (
                  <option key={u.id_usuario} value={String(u.id_usuario)}>
                    {full || `Usuario ${u.id_usuario}`}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Mostrar error si existe */}
          {error && (
            <p className="text-red-500 text-sm text-center mb-3">{error}</p>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              disabled={isLoading}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg text-white font-medium ${
                isLoading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

AddArea.propTypes = {
  onClose: PropTypes.func.isRequired,
  onAreaAdded: PropTypes.func.isRequired,
};

export default AddArea;

