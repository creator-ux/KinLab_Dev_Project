import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../apiClient'; // Importa tu cliente API
import Loader from '../components/common/Loader';
import Pagination from '../components/common/Pagination';
import { FiFilter } from 'react-icons/fi';

function ReturnStatusPage() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtros: 'todos', 'en_prestamo', 'devuelto'
  const [filtroActivo, setFiltroActivo] = useState('todos'); 
  const [isFiltroOpen, setIsFiltroOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Puedes ajustar esto

  // Carga los datos de AMBAS APIs (equipos y componentes)
  const fetchAllLoans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Peticiones en paralelo
      const [equiposRes, componentesRes] = await Promise.all([
        api.get('/api/loansEquipment'),
        api.get('/api/loansComponents')
      ]);

      // 2. Mapear y unificar equipos
      const equipos = equiposRes.map(item => ({
        ...item,
        id_unico: `e-${item.id_prestamoE}`, // ID único para el key de React
        tipo: 'Equipo',
        nombre_item: item.nombre_equipo
      }));

      // 3. Mapear y unificar componentes
      const componentes = componentesRes.map(item => ({
        ...item,
        id_unico: `c-${item.id_prestamoC}`, // ID único
        tipo: 'Componente',
        nombre_item: item.nombre_componente
      }));

      // 4. Combinar y ordenar por fecha más reciente
      const allData = [...equipos, ...componentes];
      const sorted = allData.sort((a, b) => new Date(b.fecha_prestamo) - new Date(a.fecha_prestamo));
      
      setSolicitudes(sorted);
      
    } catch (err) {
      console.error("Error al cargar préstamos:", err);
      setError("No se pudieron cargar los datos de préstamos.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllLoans();
  }, [fetchAllLoans]);

  // Lógica de filtrado
  const filteredSolicitudes = useMemo(() => {
    return solicitudes.filter(s => {
      if (filtroActivo === 'todos') return true;
      if (filtroActivo === 'en_prestamo') return s.devuelto === 0;
      if (filtroActivo === 'devuelto') return s.devuelto === 1;
      return true;
    });
  }, [solicitudes, filtroActivo]);

  // Lógica de Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSolicitudes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSolicitudes.length / itemsPerPage);

  // --- Renderizado de la tabla ---
  const renderTableContent = () => {
    if (isLoading) return <Loader colSpan={5} />;
    if (error) return <tr key="error"><td colSpan={5} className="text-center py-4 text-red-500">{error}</td></tr>;
    if (currentItems.length === 0) return <tr key="no-data"><td colSpan={5} className="text-center py-4">No hay préstamos para mostrar.</td></tr>;

    return currentItems.map((solicitud) => {
      const isDevuelto = solicitud.devuelto === 1;
      const estadoText = isDevuelto ? 'Devuelto' : 'En Préstamo';
      const estadoClass = isDevuelto ? 'bg-gray-200 text-gray-800' : 'bg-blue-100 text-blue-800';

      return (
        <tr key={solicitud.id_unico} className="border-b border-gray-200 hover:bg-gray-50">
          <td className="py-3 px-5">{solicitud.tipo}</td>
          <td className="py-3 px-5 font-medium">{solicitud.nombre_item}</td>
          <td className="py-3 px-5">{solicitud.nombre_usuario}</td>
          <td className="py-3 px-5">{new Date(solicitud.fecha_prestamo).toLocaleDateString()}</td>
          <td className="py-3 px-5">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${estadoClass}`}>
              {estadoText}
            </span>
          </td>
        </tr>
      );
    });
  };

  // --- RETURN DEL COMPONENTE ---
  return (
    // 1. Contenedor principal con h-full (para el sticky footer)
    <div className="p-4 md:p-6 lg:p-8 flex flex-col h-full">
      {/* Encabezado */}
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Estado de Préstamos
      </h1>
      
      {/* 2. Contenido que crece (para el sticky footer) */}
      <div className="flex-grow">
        {/* Controles (solo filtro) */}
        <div className="flex justify-end mb-4">
          <div className="relative">
            <button onClick={() => setIsFiltroOpen(!isFiltroOpen)} className="flex items-center bg-white border border-gray-300 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
              <FiFilter className="mr-2" />
              Filtro
            </button>
            {isFiltroOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                <a onClick={() => { setFiltroActivo('todos'); setIsFiltroOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Todos</a>
                <a onClick={() => { setFiltroActivo('en_prestamo'); setIsFiltroOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">En Préstamo</a>
                <a onClick={() => { setFiltroActivo('devuelto'); setIsFiltroOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Devueltos</a>
              </div>
            )}
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="min-w-full w-full">
            <thead>
              <tr className="bg-gray-100 text-left text-gray-600 uppercase text-sm">
                <th className="py-3 px-5 font-semibold">Tipo</th>
                <th className="py-3 px-5 font-semibold">Nombre del Ítem</th>
                <th className="py-3 px-5 font-semibold">Usuario</th>
                <th className="py-3 px-5 font-semibold">Fecha Préstamo</th>
                <th className="py-3 px-5 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {renderTableContent()}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* 3. Paginación (sticky footer) */}
      <div className="mt-4">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}

export default ReturnStatusPage;