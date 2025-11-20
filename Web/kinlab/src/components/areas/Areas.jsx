import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../apiClient.js';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import Loader from '../common/Loader';
import DeleteArea from './CRUD_Areas/DeleteArea'; // Importa el modal de Borrado específico
import EditArea from './CRUD_Areas/EditArea'; // Importa el modal de Edición

// 1. SIGUIENDO TU LÓGICA: Esta tabla NO recibe 'onEdit'
function AreasTable() {
  const [areas, setAreas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. La tabla maneja su PROPIO estado de modales (como tu Components.jsx)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [areaToEdit, setAreaToEdit] = useState(null);
  const [areaToDelete, setAreaToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  // 3. Lógica de Edición INTERNA
  const handleEditClick = (area) => {
    setAreaToEdit(area);
    setIsEditModalOpen(true);
  };
  
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setAreaToEdit(null);
  };

  // 4. Lógica de Borrado INTERNA
  const handleDeleteClick = (area) => {
    setAreaToDelete(area);
    setDeleteError(null); 
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setAreaToDelete(null);
    setDeleteError(null);
  };

  // 5. Carga de datos (como tu Components.jsx)
  const fetchAreas = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get('/api/laboratory');

      // Enriquecer con el nombre completo del encargado usando el endpoint de detalles
      const enriched = await Promise.all(
        (data || []).map(async (area) => {
          try {
            const detalles = await api.get(`/api/laboratory/${area.id_laboratorio}/detalles`);
            const fullName = [detalles?.nombre, detalles?.apellido_paterno, detalles?.apellido_materno]
              .filter(Boolean)
              .join(' ');
            return {
              ...area,
              encargado_nombre_completo: fullName || 'Sin encargado',
            };
          } catch (_) {
            // Si falla o no hay encargado, mostrar "Sin encargado"
            return {
              ...area,
              encargado_nombre_completo: 'Sin encargado',
            };
          }
        })
      );

      // Asegurar orden 1,2,3... por id en el frontend
      const sorted = enriched.slice().sort((a, b) => (a?.id_laboratorio ?? 0) - (b?.id_laboratorio ?? 0));
      setAreas(sorted);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false); 
    }
  }, []);

  useEffect(() => {
    fetchAreas();
    // 6. Listener para refrescar (como tu Components.jsx)
    const handleAreaUpdate = () => fetchAreas();
    globalThis.addEventListener('area-updated', handleAreaUpdate);
    return () => {
      globalThis.removeEventListener('area-updated', handleAreaUpdate);
    };
  }, [fetchAreas]);

  // 7. Lógica de borrado (como tu Components.jsx)
  const handleConfirmDelete = async () => {
    if (!areaToDelete) return;
    setDeleteError(null); 
    try {
      await api.del(`/api/laboratory/${areaToDelete.id_laboratorio}`);
      // Refrescar datos
      fetchAreas(); 
      closeDeleteModal();
      // Banner de confirmación de eliminación
      globalThis.dispatchEvent(new CustomEvent('notify', { detail: { type: 'warning', message: 'Laboratorio eliminado' }}));
    } catch (error) {
      console.error("Error al eliminar:", error);
      setDeleteError(error.message); 
    }
  };


  const renderTableContent = () => {
    if (isLoading) return[ <Loader key="Loader" colSpan={3} />]; 
    if (error) return[ <tr key='error'><td colSpan="3" className="text-center py-5 text-red-500">{error}</td></tr> ];
    if (!isLoading && areas.length === 0) return[ <tr key='no-data'><td colSpan="3" className="text-center py-5 text-gray-500">No se encontraron laboratorios.</td></tr> ];

    return areas.map((area) => (
      <tr key={area.id_laboratorio} className="border-b border-gray-200 hover:bg-gray-50">
        <td className="py-3 px-5">{area.nombre_laboratorio}</td>
        <td className="py-3 px-5">{area.encargado_nombre_completo ?? 'Sin encargado'}</td>
        <td className="py-3 px-5 text-center">
          <div className="flex item-center justify-center space-x-3">
            <button 
              onClick={() => handleEditClick(area)} // Llama a la función INTERNA
              title="Editar" 
              className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-blue-600 hover:text-white transition-colors duration-200">
                <FaEdit size={19} />
            </button>
            <button 
              onClick={() => handleDeleteClick(area)} // Llama a la función INTERNA
              title="Eliminar" 
              className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-red-600 hover:text-white transition-colors duration-200">
                <FaTrashAlt size={19} />
            </button>
          </div>
        </td>
      </tr>
    ));
  };
 
  return (
    <div className='flex flex-col min-h-full justify-between'>
      <div className="flex-grow pb-4">
        
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="min-w-full w-full">
            <thead>
              <tr className="bg-gray-100 text-left text-gray-600 uppercase text-sm">
                <th className="py-3 px-5 font-semibold">Nombre del Laboratorio</th>
                <th className="py-3 px-5 font-semibold">Nombre del encargado</th>
                <th className="py-3 px-5 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-gray-800">
              {renderTableContent()}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* 9. La tabla renderiza SUS PROPIOS modales de Edición y Borrado */}
      {isEditModalOpen && areaToEdit && (
        <EditArea
          onClose={closeEditModal}
          onAreaUpdated={closeEditModal} 
          areaToEdit={areaToEdit}
        />
      )}

      {isDeleteModalOpen && (
        <DeleteArea
          message={`¿Estás seguro de eliminar "${areaToDelete?.nombre_laboratorio}"?`}
          errorMessage={deleteError} 
          onConfirm={handleConfirmDelete}
          onCancel={closeDeleteModal}
        />
      )}
    </div>
  );
}

export default AreasTable;


