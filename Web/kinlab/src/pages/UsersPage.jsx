import React, { useState } from 'react';
import UsuariosTable from '../components/users/UsersTable';
import AddUsuario from '../components/users/CRUD_Users/AddUser';
import { FaPlus } from 'react-icons/fa';

/**
 * Página principal para la gestión de Usuarios.
 * Sigue el patrón de AreasPage: la Página maneja el modal de "Agregar".
 */
function UsersPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Funciones para el modal de AGREGAR
  const openAddModal = () => setIsAddModalOpen(true);
  const closeAddModal = () => setIsAddModalOpen(false);

  return (
    // Layout de altura completa para el "sticky footer"
    <div className="p-4 md:p-6 lg:p-8 flex flex-col h-full">

      {/* --- Encabezado y Acciones --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">
          Gestión de Usuarios
        </h1>
        
        <button 
          onClick={openAddModal} 
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 shadow">
          <FaPlus className="mr-2" />
          Nuevo Usuario
        </button>
      </div>

      {/* Contenido de la Tabla (ocupa el espacio restante) */}
      <div className="flex-grow min-h-0">
        <UsuariosTable />
      </div>

      {/* --- Modal para Agregar --- */}
      {isAddModalOpen && (
        <AddUsuario 
          onClose={closeAddModal}
          onUserAdded={closeAddModal} // Cierra el modal al agregar
        />
      )}
    </div>
  );
}

export default UsersPage;