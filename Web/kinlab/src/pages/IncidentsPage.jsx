import React, { useEffect, useState } from 'react';
import { FaLock, FaLockOpen, FaInfoCircle } from 'react-icons/fa';
import { api } from '../apiClient.js';
// Se eliminaron los imports no utilizados
import Loader from '../components/common/Loader';
import PaginationFooter from '../components/common/Pagination';

function IncidentsPage() {
    const [incidentes, setIncidentes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    // Estado local solo visual para bloquear/desbloquear por incidente
    const [blockedIds, setBlockedIds] = useState([]);
    // Modal de detalles
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState(null);
    
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchIncidentes = async () => {
            try {
                const data = await api.get('/api/incidents');
                setIncidentes(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchIncidentes();
    }, []);

    const formatFecha = (fechaISO) => {
        if (!fechaISO) return '';
        const fecha = new Date(fechaISO);
        return fecha.toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' });
    };

    const getEstadoInfo = (estado) => {
        switch (estado) {
            case 'pendiente': return { text: 'Pendiente', className: 'bg-orange-100 text-orange-800' };
            case 'en_revision': return { text: 'En Revisión', className: 'bg-blue-100 text-blue-800' };
            case 'resuelto': return { text: 'Resuelto', className: 'bg-green-100 text-green-800' };
            default: return { text: 'Desconocido', className: 'bg-gray-100 text-gray-800' };
        }
    };
    
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = incidentes.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(incidentes.length / itemsPerPage);

    const renderTableContent = () => {
        if (isLoading) return <Loader colSpan={5} />;
        if (error) return <tr key="error"><td colSpan={5} className="text-center py-4 text-red-500">{error}</td></tr>;
        if (currentItems.length === 0) return <tr key="no-data"><td colSpan={5} className="text-center py-4">No hay incidentes reportados.</td></tr>;

        const toggleBlock = (id) => {
            setBlockedIds(prev => (
                prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
            ));
        };

        const openDetails = (incidente) => {
            setSelectedIncident(incidente);
            setDetailsOpen(true);
        };

        return currentItems.map((incidente) => {
            const { text, className } = getEstadoInfo(incidente.estado);
            const isBlocked = blockedIds.includes(incidente.id_incidente);
            return (
                <tr key={incidente.id_incidente} className="border-b border-gray-200 hover:bg-gray-50 text-sm">
                    <td className="py-3 px-5 font-medium">
                        <div title={incidente.titulo} className="truncate max-w-xs">{incidente.titulo}</div>
                    </td>
                    <td className="py-3 px-5">
                        <div title={incidente.descripcion} className="truncate max-w-sm">{incidente.descripcion}</div>
                    </td>
                    <td className="py-3 px-5">{incidente.nombre_usuario || 'N/A'}</td>
                    <td className="py-3 px-5">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${className}`}>
                            {text}
                        </span>
                    </td>
                    <td className="py-3 px-5 text-center">
                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={() => toggleBlock(incidente.id_incidente)}
                                className={`p-2 rounded-full border transition-colors shadow-sm
                                    ${isBlocked ? 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}`}
                                title={isBlocked ? 'Desbloquear usuario' : 'Bloquear usuario'}
                            >
                                {isBlocked ? <FaLockOpen size={14} /> : <FaLock size={14} />}
                            </button>
                            <button
                                onClick={() => openDetails(incidente)}
                                className="p-2 rounded-full bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 shadow-sm"
                                title="Ver detalles"
                            >
                                <FaInfoCircle size={14} />
                            </button>
                        </div>
                    </td>
                </tr>
            );
        });
    };

    return (
        <div className="flex flex-col h-full">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Reporte de Incidentes</h1>
            <div className="flex-grow bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="min-w-full w-full">
                    <thead>
                        <tr className="bg-gray-50 text-left text-gray-700 uppercase text-xs">
                            <th className="py-3 px-5 font-semibold">Título</th>
                            <th className="py-3 px-5 font-semibold">Descripción</th>
                            <th className="py-3 px-5 font-semibold">Reportado por</th>
                            <th className="py-3 px-5 font-semibold">Estado</th>
                            <th className="py-3 px-5 font-semibold text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        {renderTableContent()}
                    </tbody>
                </table>
            </div>
             <PaginationFooter
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

            {/*Apartado de detalles para los reportes*/}
            
            {detailsOpen && selectedIncident && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl ring-4 ring-gray-200 w-full max-w-lg p-6">
                        <h3 className="text-2xl font-semibold text-center text-gray-800 mb-3">Detalles del incidente</h3>
                        <div className="border-t border-gray-200 pt-4 space-y-3 text-[16px] leading-relaxed text-gray-700">
                            <div><span className="font-semibold">Título:</span> {selectedIncident.titulo}</div>
                            <div><span className="font-semibold">Descripción:</span> {selectedIncident.descripcion}</div>
                            {selectedIncident.item_afectado && (
                                <div><span className="font-semibold">Ítem dañado:</span> {selectedIncident.item_afectado}</div>
                            )}
                            <div><span className="font-semibold">Reportado por:</span> {selectedIncident.nombre_usuario || 'N/A'}</div>
                            <div><span className="font-semibold">Estado:</span> {getEstadoInfo(selectedIncident.estado).text}</div>
                            {selectedIncident.fecha_reporte && (
                                <div><span className="font-semibold">Fecha:</span> {formatFecha(selectedIncident.fecha_reporte)}</div>
                            )}
                            {selectedIncident.accion_tomada && (
                                <div><span className="font-semibold">Acción tomada:</span> {selectedIncident.accion_tomada}</div>
                            )}
                        </div>
                        <div className="mt-6 flex justify-center">
                            <button
                                onClick={() => { setDetailsOpen(false); setSelectedIncident(null); }}
                                className="px-5 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default IncidentsPage;
