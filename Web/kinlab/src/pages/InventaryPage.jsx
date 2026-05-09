import React, { useState } from 'react';
import EquiposTable from '../components/inventary/Equipments';
import ComponentesTable from '../components/inventary/Components';
import { useAuth } from '../hooks/useAuth.js'; 
import { isAdmin } from '../utils/permissions.js';
import { FaPlus } from 'react-icons/fa';
import { useSearchParams } from 'react-router-dom';

import AddCategory from '../components/inventary/AddCategory';
import AddSubcategory from '../components/inventary/AddSubcategory';

function InventaryPage() {
  
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState(
    initialTab === 'componentes' ? 'componentes' : 'equipos'
  );

  const { user } = useAuth();

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);

  return (
    <div className="p-4 md:p-6 lg:p-8 flex flex-col h-full">

      {/* --- Encabezado y Acciones --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">Gestión de Inventario</h1>
      </div>

       {/* Botones visibles sólo para administrador nivel 0 */}
      {isAdmin(user) && (
        <div className="flex space-x-2 md-4">
          <button 
            onClick={() => setIsCategoryModalOpen(true)} 
            className="flex items-center bg-white border border-gray-300 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
            <FaPlus className="mr-2" />
              Categoría
          </button>
          <button 
            onClick={() => setIsSubcategoryModalOpen(true)} 
            className="flex items-center bg-white border border-gray-300 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
            <FaPlus className="mr-2" />
              Subcategoría
          </button>
        </div>
      )}
      
      {/* --- Pestañas de Navegación (Tabs) --- */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('equipos')}
          className={`py-2 px-4 font-semibold ${
            activeTab === 'equipos'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Equipos
        </button>
        <button
          onClick={() => setActiveTab('componentes')}
          className={`py-2 px-4 font-semibold ${
            activeTab === 'componentes'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Componentes
        </button>
      </div>

      {/* --- Contenido Condicional de las Pestañas --- */}
      <div className="flex-grow min-h-0">
        {activeTab === 'equipos' ? <EquiposTable /> : <ComponentesTable />}
      </div>

      {/* Renderizado condicional de los nuevos modales */}
        {isCategoryModalOpen && <AddCategory onClose={() => setIsCategoryModalOpen(false)} />}
        {isSubcategoryModalOpen && <AddSubcategory onClose={() => setIsSubcategoryModalOpen(false)} />}
    </div>
  );
}

export default InventaryPage;
