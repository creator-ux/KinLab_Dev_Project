import React, { useEffect, useState, useMemo } from "react";
import { api } from "../apiClient.js";
import { FiFilter } from "react-icons/fi";
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Loader from "../components/common/Loader";
import Pagination from "../components/common/Pagination";

function RecordPage(){
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filtroFecha, setFiltroFecha] = useState('todos'); // 'todos', '7dias', '30dias'

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 11; 

    useEffect (() => {
        const fetchLogs = async () => {
            try{
                const data = await api.get('/api/reportes');
                setLogs(data);
            } catch (error){
                setError(error.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const formatTipoMovimiento = (tipo) => {
        return (tipo.charAt(0).toUpperCase() + tipo.slice(1)).replace(/_/g, ' ');
    };

    const formatFecha = (fechaISO) => {
        const fecha = new Date(fechaISO);
        return fecha.toLocaleString('es-MX', {
           dateStyle: 'long', timeStyle: 'short'
        });
    };

    const filteredLogs = useMemo(() => logs.filter(log => {
        if (filtroFecha === 'todos') return true;
        const fechaLog = new Date(log.fecha);
        const diasAtras = filtroFecha === '7dias' ? 7 : 30;
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - diasAtras);
        return fechaLog >= fechaLimite;
    }), [logs, filtroFecha]);

    // Calcula los items para la página actual
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

    const renderTableContent = () => {
        if (isLoading) return <Loader colSpan={4} />;
        if (error) return <tr key="error"><td colSpan={4} className="text-center py-4 text-red-500">{error}</td></tr>;
        if (filteredLogs.length === 0) return <tr key="no-data"><td colSpan={4} className="text-center py-4">No hay movimientos para mostrar.</td></tr>;

        return currentItems.map((log) => (
            <tr key={log.id_log} className="border-b border-gray-200 hover:bg-gray-50 text-sm">
                <td className="py-3 px-5">{formatFecha(log.fecha)}</td>
                <td className="py-3 px-5 font-medium">{formatTipoMovimiento(log.tipo_movimiento)}</td>
                <td className="py-3 px-5">
                    <div title={log.detalle} className="truncate max-w-sm">
                        {log.detalle}
                    </div>
                </td>
                <td className="py-3 px-5 text-sm">{log.nombre_usuario || 'Sistema'}</td>
            </tr>
        ));
    };

    return (
        <div className="flex flex-col min-h-full justify-between">
        <div className="flex-grow pb-4">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Historial de Movimientos</h1>
                
                <div className="relative">
                    <select
                        value={filtroFecha}
                        onChange={(e) => setFiltroFecha(e.target.value)}
                        className="appearance-none bg-white border border-gray-300 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 pr-8"
                    >
                        <option value="todos">Todos</option>
                        <option value="7dias">Últimos 7 días</option>
                        <option value="30dias">Últimos 30 días</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <FiFilter />
                    </div>
                </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="min-w-full w-full">
                    <thead>
                        <tr className="bg-gray-100 text-left text-gray-600 uppercase text-xs">
                            <th className="py-3 px-5 font-semibold">Fecha y Hora</th>
                            <th className="py-3 px-5 font-semibold">Tipo de Movimiento</th>
                            <th className="py-3 px-5 font-semibold">Detalle</th>
                            <th className="py-3 px-5 font-semibold">Usuario</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        {renderTableContent()}
                    </tbody>
                </table>
            </div>
            </div>

            <div className="mt-4">
                <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                />
            </div>
            
        </div>
    );
};

export default RecordPage;