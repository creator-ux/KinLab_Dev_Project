import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { api } from "../../apiClient"; // Asumiendo que tienes tu api client
import Loader from '../common/Loader';
import Pagination from '../common/Pagination';
import DeleteUsuario from './CRUD_Users/DeleteUser';
import EditUsuario from './CRUD_Users/EditUser';
import { AuthContext } from '../../context/AuthContext.jsx';
import { isAdminLevel } from '../../utils/permissions.js';

/**
 * Mapea el 'tipo' a un texto y color.
 */
const getTipoInfo = (tipo) => {
  switch (tipo) {
    case 'administrador': return { texto: 'Administrador', className: 'bg-indigo-100 text-indigo-800' };
    case 'usuario': return { texto: 'Usuario', className: 'bg-green-100 text-green-800' };
    default: return { texto: tipo, className: 'bg-gray-100 text-gray-800' };
  }
};

/**
 * Tabla que carga datos de usuarios y maneja modales de Edición/Borrado.
 */
function UsersTable() {
  const { user } = useContext(AuthContext);
  const canDelete = isAdminLevel(user, 0); // sólo admin nivel 0
  const showRoleColumns = isAdminLevel(user, 0); // Tipo y Nivel visibles solo para admin nivel 0
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7; // Reducido para mejor visualización

  // Estado para los modales
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [usuarioToEdit, setUsuarioToEdit] = useState(null);
  const [usuarioToDelete, setUsuarioToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  // Carga de datos
  const fetchUsuarios = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      
      const data = await api.get('/api/users');
      // Ordenar por nombre
      const sorted = [...data].sort((a, b) => a.nombre.localeCompare(b.nombre));
      setUsuarios(sorted);
    } catch (err) {
      setError(err.message || "No se pudo cargar la información de usuarios.");
    } finally {
      setIsLoading(false); 
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
    const handleUpdate = () => fetchUsuarios();
    globalThis.addEventListener('user-updated', handleUpdate);
    return () => {
      globalThis.removeEventListener('user-updated', handleUpdate);
    };
  }, [fetchUsuarios]);

  // Lógica de Paginación
  const currentItems = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return usuarios.slice(indexOfFirstItem, indexOfLastItem);
  }, [usuarios, currentPage, itemsPerPage]);
  
  const totalPages = Math.ceil(usuarios.length / itemsPerPage);

  // --- Handlers de Modales ---
  const handleEditClick = (usuario) => {
    setUsuarioToEdit(usuario);
    setIsEditModalOpen(true);
  };
  const closeEditModal = () => {
    setIsEditModalOpen(false); // Cierra modal
    setUsuarioToEdit(null); // Limpia el usuario
  };
  
  const handleDeleteClick = (usuario) => {
    if (!canDelete) {
      globalThis.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: 'No tienes permiso para eliminar usuarios.' }}));
      return;
    }
    setUsuarioToDelete(usuario);
    setDeleteError(null); 
    setIsDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setUsuarioToDelete(null);
    setDeleteError(null);
  };

  // Lógica de borrado
  const handleConfirmDelete = async () => {
    if (!usuarioToDelete) return;
    setDeleteError(null); 
    try {
      
      await api.del(`/api/users/${usuarioToDelete.id_usuario}`);
      globalThis.dispatchEvent(new CustomEvent('notify', { detail: { type: 'danger', message: `Usuario eliminado: ${usuarioToDelete.nombre} ${usuarioToDelete.apellido_paterno}` }}));
      fetchUsuarios(); // Recarga los datos
      closeDeleteModal();
    } catch (error) {
      setDeleteError(error.message || "No se pudo eliminar el usuario.");
      globalThis.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: `Error al eliminar usuario: ${error.message || 'desconocido'}` }}));
    }
  };

  const renderTableContent = () => {
    const colCount = 5 + (showRoleColumns ? 2 : 0); // base 5 + Tipo/Nivel opcionales
    if (isLoading) return <Loader colSpan={colCount} />; 
    if (error) return <tr key='error'><td colSpan={colCount} className="text-center py-5 text-red-500">{error}</td></tr>;
    if (currentItems.length === 0) return <tr key='no-data'><td colSpan={colCount} className="text-center py-5 text-gray-500">No se encontraron usuarios.</td></tr>;

    return currentItems.map((usuario) => {
      const { texto, className } = getTipoInfo(usuario.tipo);
      const nombreCompleto = `${usuario.nombre} ${usuario.apellido_paterno} ${usuario.apellido_materno}`;

      return (
        <tr key={usuario.id_usuario} className="border-b border-gray-200 hover:bg-gray-50">
          
          <td className="py-3 px-5 font-medium">{nombreCompleto}</td>
          <td className="py-3 px-5">{usuario.matricula?.trim() ? usuario.matricula : 'S/M'}</td>
          <td className="py-3 px-5">{usuario.correo}</td>
          <td className="py-3 px-5">{usuario.telefono}</td>
          
          {showRoleColumns && (
            <td className="py-3 px-5">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${className}`}>
                {texto}
              </span>
            </td>
          )}
          {showRoleColumns && (
            <td className="py-3 px-5">{usuario.nivel}</td>
          )}
          
          <td className="py-3 px-5 text-center">
            <div className="flex item-center justify-center space-x-3">
              <button 
                onClick={() => handleEditClick(usuario)}
                title="Editar" 
                className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-blue-600 hover:text-white transition-colors duration-200">
                  <FaEdit size={19} />
              </button>
              {canDelete && (
                <button 
                  onClick={() => handleDeleteClick(usuario)}
                  title="Eliminar" 
                  className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-red-600 hover:text-white transition-colors duration-200">
                    <FaTrashAlt size={19} />
                </button>
              )}
            </div>
          </td>
        </tr>
      );
    });
  };
 
  return (
    // Layout de "sticky footer"
    <div className='flex flex-col min-h-full justify-between'>
      <div className="flex-grow pb-4">
        
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="min-w-full w-full">
            <thead>
              <tr className="bg-gray-100 text-left text-gray-600 uppercase text-sm">
                <th className="py-3 px-5 font-semibold">Nombre Completo</th>
                <th className="py-3 px-5 font-semibold">Matrícula</th>
                <th className="py-3 px-5 font-semibold">Correo</th>
                <th className="py-3 px-5 font-semibold">Teléfono</th>
                {showRoleColumns && (
                  <th className="py-3 px-5 font-semibold">Tipo</th>
                )}
                {showRoleColumns && (
                  <th className="py-3 px-5 font-semibold">Nivel</th>
                )}
                <th className="py-3 px-5 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-gray-800">
              {renderTableContent()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      <div className="mt-4">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modales que maneja esta tabla */}
      {isEditModalOpen && usuarioToEdit && (
        <EditUsuario
          usuarioToEdit={usuarioToEdit}
          onClose={closeEditModal}
          onUserUpdated={closeEditModal} 
        />
      )}

      {isDeleteModalOpen && (
        <DeleteUsuario
          message={`¿Estás seguro de eliminar a "${usuarioToDelete?.nombre} ${usuarioToDelete?.apellido_paterno}"?`}
          errorMessage={deleteError} 
          onConfirm={handleConfirmDelete}
          onCancel={closeDeleteModal}
        />
      )}
    </div>
  );
}

export default UsersTable;
