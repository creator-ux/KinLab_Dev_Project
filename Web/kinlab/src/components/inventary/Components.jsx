import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { api } from '../../apiClient.js';
import { FaEdit, FaTrashAlt, FaPlus } from 'react-icons/fa';
import { FiFilter, FiSearch } from 'react-icons/fi';
//Componentes modales
import AddComponent from './CRUD_Component/AddComponent';//modal de inserts
import EditComponent from './CRUD_Component/EditComponent';//modal para editar
import DeleteComponent from './CRUD_Component/DeleteComponent';//modal para eliminar

import Loader from '../common/Loader';
import Pagination from '../common/Pagination'

function Components() {
  // maenjo de estados
  const [componentes, setComponentes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  //estado para el crud de los modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  //estado de editación y eliminación
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [componentToDelete, setComponentToDelete] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

    const fetchComponentes = useCallback (async() => {
      try{
        const data = await api.get('/api/component');
        setComponentes(data);
      } catch (error) {
        console.error('Error al cargar los componentes: ', error);
        setError(error.message);
      } finally {
         setIsLoading(false);
      }
    }, []);
    
  useEffect (() => {
    fetchComponentes();
    const handleInventoryUpdate = () => {
      console.log("Recargando datos de inventario...");
      fetchComponentes();
    };

    globalThis.addEventListener('inventory-updated', handleInventoryUpdate);

    return () =>{
      globalThis.removeEventListener('inventory-updated', handleInventoryUpdate);
    }
    
  }, [fetchComponentes]);

  // handlers para las acciones CRUD

  const handleComponentAdded = (newComponent) => {
    setComponentes(prev => [...prev, newComponent]);
  }

  const handleComponentUpdated = (updatedComponent) => {
    setComponentes (prev => prev.map( c =>
      c.id_componente === updatedComponent.id_componente ? updatedComponent : c)
    );
  };

  const handleEditClick = (componente) => {
    setSelectedComponent (componente);
    setIsEditModalOpen (true);
  };

  const handleDeleteClick = (componente) => {
    setComponentToDelete (componente);
    setIsDeleteModalOpen (true);
  };

  const handleConfirmDelete = async () => {
    if (!componentToDelete) return;
    try{
      await api.del(`/api/component/${componentToDelete.id_componente}`);

      setComponentes(prev => prev.filter(c => c.id_componente !== componentToDelete.id_componente));
      setIsDeleteModalOpen(false);
          globalThis.dispatchEvent(new CustomEvent('notify', { detail: { type: 'danger', message: 'Componente eliminado' }}));
    } catch (err) {
      globalThis.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: `Error: ${err.message}` }}));
    }
  };
  
  // filtrado y estilos
    const filteredComponentes = useMemo(() => componentes.filter(c =>
          c.nombre_componente.toLowerCase().includes(searchTerm.toLowerCase())
      ), [componentes, searchTerm]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredComponentes.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredComponentes.length / itemsPerPage);

    const capitalizeFirstLetter = (string) => {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    const getEstadoClass = (estado) => {
        switch (estado) {
            case 'disponible': return 'bg-green-100 text-green-800';
            case 'en_uso': return 'bg-blue-100 text-blue-800';
            case 'dañado': return 'bg-red-100 text-red-800';
            case 'en_mantenimiento': return 'bg-yellow-100 text-yellow-800';
            case 'agotado': return 'bg-gray-200 text-gray-700';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    //renderizado de la tabla
    const renderTableContent = () => {
        if (isLoading) return <Loader colSpan={5} />; 
        
        if (error) return (

              <tr key="error">
                <td colSpan="5" className="text-center py-4 text-red-500">Advertencia: {error}</td>
              </tr>   
              
        ); 
        
        if (filteredComponentes.length === 0) return (

            <tr key="no-data">
              <td colSpan="5" className="text-center py-4">No se encontraron componentes.</td>
            </tr>
        );
        return currentItems.map((componente) => (
            <tr key={componente.id_componente} className="border-b border-gray-200 hover:bg-gray-50">

                <td className="py-3 px-5 font-medium">
                  {componente.nombre_componente}
                </td>

                <td className="py-3 px-5 text-center">
                  {componente.cantidad}
                </td>

                <td className="py-3 px-5">
                  {componente.descripcion}
                </td>

                <td className="py-3 px-5">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getEstadoClass(componente.estado)}`}>
                        {componente.estado === 'disponible' 
                          ? `Disponible: ${componente.cantidad}`
                          : capitalizeFirstLetter(componente.estado)}
                    </span>
                </td>

                <td className="py-3 px-5 text-center">
                    <div className="flex items-center justify-center space-x-3">
                        <button 
                          onClick={() => handleEditClick(componente)} 
                          title="Editar" 
                          className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-blue-600 hover:text-white transition-colors duration-200">
                            <FaEdit size={19} />
                        </button>
                        
                        <button 
                          onClick={() => handleDeleteClick(componente)} 
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

    <div className="flex flex-col min-h-full justify-between"> 
      <div className="flex-grow pb-4">
        {/* --- Controles de la Tabla --- */}
        <div className="flex items-center justify-end space-x-2 mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar componente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-50"
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          {/* 
          <button className="flex items-center bg-white border border-gray-300 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
            <FiFilter className="mr-2" />
            Filtro
          </button>
          */}
          <button 
            onClick={() => setIsAddModalOpen(true)} 
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 shadow">
            <FaPlus className="mr-2" />
            Agregar
          </button>
        </div>

        {/* --- Tabla de Componentes --- */}
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="min-w-full w-full">
            <thead>
              <tr className="bg-gray-100 text-left text-gray-600 uppercase text-sm">
                <th className="py-3 px-5 font-semibold">Nombre del Componente</th>
                <th className="py-3 px-5 font-semibold">Cantidad</th>
                <th className="py-3 px-5 font-semibold">Descripción</th>
                <th className="py-3 px-5 font-semibold">Estado</th>
                <th className="py-3 px-5 font-semibold text-center">Acciones</th>
              </tr>
            </thead>

            <tbody className="text-gray-800">
              {renderTableContent()}
            </tbody>
          </table>
        </div>
      </div> 

    <div className='mt-4'>
      <Pagination
        currentPage = {currentPage}
        totalPages = {totalPages}
        onPageChange = {setCurrentPage}
      />
    </div>

     {/* Renderizado Condicional de Modales */}
    {isAddModalOpen && (
      <AddComponent 
        onClose={() => setIsAddModalOpen(false)}
        onComponentAdded={handleComponentAdded}
        />
    )}

    {isEditModalOpen && (
      <EditComponent
        componentToEdit={selectedComponent}
          onClose={() => setIsEditModalOpen(false)}
          onComponentUpdated={handleComponentUpdated}
        />
    )}
    
    {isDeleteModalOpen && (
      <DeleteComponent
        message={`¿Estás seguro de eliminar "${componentToDelete?.nombre_componente}"?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        />
    )}
    </div>
  );
}

export default Components;
