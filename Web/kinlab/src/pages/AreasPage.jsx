import React, { useState } from 'react';
import AreasTable from '../components/areas/Areas'; 
import AddArea from '../components/areas/CRUD_Areas/AddArea';
import EditArea from '../components/areas/CRUD_Areas/EditArea'; 
import { FaPlus } from 'react-icons/fa';

function AreasPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [areaToEdit, setAreaToEdit] = useState(null);

  const handleEdit = (area) => {
    setAreaToEdit(area);
    setIsEditModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setAreaToEdit(null);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 flex flex-col h-full">

      {/* --- Encabezado y Acciones --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        
        <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">Gestión de Laboratorios</h1>
        
        <button 
          onClick={() => setIsAddModalOpen(true)} 
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 shadow">
          <FaPlus className="mr-2" />
          Agregar
        </button>
      </div>

      {/* Contenido de la Tabla */}
      <div className="flex-grow min-h-0">
        <AreasTable 
          onEdit={handleEdit} 
        />
      </div>

      {/* --- Modales --- */}
      {isAddModalOpen && (
        <AddArea 
          onClose={closeAddModal}
          onAreaAdded={closeAddModal}
        />
      )}
      
      {/* 6. Renderizado del modal de Edición */}
      {isEditModalOpen && areaToEdit && (
        <EditArea
          onClose={closeEditModal}
          onAreaUpdated={closeEditModal} // Corregido: onAreaUpdated
          areaToEdit={areaToEdit}
        />
      )}
    </div>
  );
}

export default AreasPage;

