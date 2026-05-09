import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../apiClient.js';
import { FaCheck, FaTimes, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';
import { FiFilter } from 'react-icons/fi';
import { HiOutlineArrowPath } from 'react-icons/hi2';
import Loader from '../common/Loader';
import Pagination from '../common/Pagination';
import InfoModal from './info/InfoModal.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { isAdminLevel } from '../../utils/permissions.js';

function LoansEquipment (){
    const { user } = useAuth();
    const showCareer = isAdminLevel(user, 0); // sólo admin nivel 0 ve "Carrera"
    const colCount = showCareer ? 9 : 8;
    const [solicitudes, setSolicitudes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filtroActivo, setFiltroActivo] = useState('todos');
    const [isFiltroOpen, setIsFiltroOpen] = useState(false);

    // Estado para el modal de incidentes
    const [incidentModalOpen, setIncidentModalOpen] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [laboratorios, setLaboratorios] = useState([]);
    const [isSubmittingIncident, setIsSubmittingIncident] = useState(false);
    const [incidentForm, setIncidentForm] = useState({
        titulo: '',
        descripcion: '',
        id_laboratorio: null,
        accion_tomada: ''
    });
    // Modal de información (motivo)
    const [infoOpen, setInfoOpen] = useState(false);
    const [infoItems, setInfoItems] = useState([]);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // Inventario de equipos (id -> cantidad)
    const [equiposMap, setEquiposMap] = useState({});

    useEffect(() => {
        const fetchSolicitudes = async () => {
            try {
                const data = await api.get('/api/loansEquipment');
                setSolicitudes(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSolicitudes();
    }, []);

    // Cargar laboratorios para el formulario de incidentes
    useEffect(() => {
        const fetchLabs = async () => {
            try {
                const labs = await api.get('/api/laboratory');
                setLaboratorios(labs);
            } catch (err) {
                // No bloquear la vista por error de labs
                console.warn('No se pudieron cargar los laboratorios:', err?.message || err);
            }
        };
        fetchLabs();
    }, []);

    // Cargar inventario actual de equipos para mostrar cantidad total y su delta
    useEffect(() => {
        const fetchEquipos = async () => {
            try {
                const data = await api.get('/api/equipment');
                const map = {};
                for (const e of data) {
                    map[e.id_equipo] = e.cantidad;
                }
                setEquiposMap(map);
            } catch (err) {
                console.error('Error al cargar inventario de equipos:', err);
            }
        };
        fetchEquipos();
    }, []);

    // Suscripción SSE: escucha eventos del backend para refrescar en tiempo real
    useEffect(() => {
        const token = localStorage.getItem('token');
        const url = `${api.baseUrl}/api/events${token ? `?token=${encodeURIComponent(token)}` : ''}`;
        let es;
        try {
            es = new EventSource(url);
            es.onmessage = (ev) => {
                try {
                    const msg = JSON.parse(ev.data);
                    if (msg && msg.topic === 'loansEquipment') {
                        globalThis.dispatchEvent(new CustomEvent('inventory-updated'));
                    }
                } catch (_) {
                    // Ignorar parseos inválidos
                }
            };
        } catch (_) {
            // Si falla, el polling seguirá funcionando
        }
        return () => { try { es && es.close(); } catch(_) {} };
    }, []);

    const handleUpdateRequest = async (id, nuevoEstado) => {
        try {
            await api.put(`/api/loansEquipment/approve/${id}`, { estado_aprobacion: nuevoEstado });
            setSolicitudes(prev => prev.map(solicitud =>
                solicitud.id_prestamoE === id
                    ? { ...solicitud, estado_aprobacion: nuevoEstado }
                    : solicitud
            ));
            globalThis.dispatchEvent(new CustomEvent('inventory-updated'));
            const msg = nuevoEstado === 1 ? 'Solicitud aprobada' : 'Solicitud rechazada';
            globalThis.dispatchEvent(new CustomEvent('notify', { detail: { type: 'info', message: msg }}));
        } catch (err) {
            globalThis.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: `Error: ${err.message}` }}));
        }
    };

    const handleReturnRequest = async (id) => {
        try {
            await api.put(`/api/loansEquipment/return/${id}`);
            setSolicitudes(prev => prev.map(solicitud =>
                solicitud.id_prestamoE === id
                    ? { ...solicitud, devuelto: 1 }
                    : solicitud
            ));
            globalThis.dispatchEvent(new CustomEvent('inventory-updated'));
            globalThis.dispatchEvent(new CustomEvent('notify', { detail: { type: 'info', message: 'Devolución confirmada' }}));
        } catch (error) {
            globalThis.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: `Error: ${error.message}` }}));
        }
    };

    const getEstadoInfo = (solicitud) => {
        if (solicitud.devuelto === 1) {
            return { text: 'Devuelto', className: 'bg-gray-200 text-gray-800' };
        }
        switch (solicitud.estado_aprobacion) {
            case 0: return { text: 'Pendiente', className: 'bg-orange-100 text-orange-800' };
            case 1: return { text: 'En Préstamo', className: 'bg-blue-100 text-blue-800' };
            case 2: return { text: 'Rechazado', className: 'bg-red-100 text-red-800' };
            default: return { text: 'Desconocido', className: 'bg-gray-100 text-gray-800' };
        }
    };

    // Ordenar siempre por fecha de préstamo (más recientes primero)
    const sortedSolicitudes = useMemo(() => (
        [...solicitudes].sort((a, b) => new Date(b.fecha_prestamo) - new Date(a.fecha_prestamo))
    ), [solicitudes]);

    const filteredSolicitudes = useMemo(() => sortedSolicitudes.filter(s => (
        filtroActivo === 'todos' || s.estado_aprobacion === filtroActivo
    )), [sortedSolicitudes, filtroActivo]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredSolicitudes.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredSolicitudes.length / itemsPerPage);
    
    // --- BOTONES ---

    const renderActions = (solicitud) => {
        // Si la solicitud está PENDIENTE
        if (solicitud.estado_aprobacion === 0) {
            return (
                <div className="flex items-center justify-center space-x-3">
                    <button onClick={() => handleUpdateRequest(solicitud.id_prestamoE, 1)} title="Aprobar" className="p-2 rounded-full bg-green-100 text-green-700 hover:bg-green-600 hover:text-white transition-colors">
                        <FaCheck size={16} />
                    </button>
                    <button onClick={() => handleUpdateRequest(solicitud.id_prestamoE, 2)} title="Rechazar" className="p-2 rounded-full bg-red-100 text-red-700 hover:bg-red-600 hover:text-white transition-colors">
                        <FaTimes size={16} />
                    </button>
                </div>
            );
        }
        // Si está APROBADA pero NO DEVUELTA
        if (solicitud.estado_aprobacion === 1 && solicitud.devuelto === 0) {
            return (
                <div className="flex justify-center">
                    <button onClick={() => handleReturnRequest(solicitud.id_prestamoE)} title="Confirmar Devolución" className="flex items-center justify-center px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors text-sm font-semibold">
                        Devuelto
                    </button>
                </div>
            );
        }
        // Si ya está procesada (Rechazada o Devuelta)
        return <span className="text-gray-400">-</span>;
    };

    const renderIncidentButton = (solicitud) => (
        <div className="flex justify-center">
            <button onClick={() => openIncidentModal(solicitud)} title="Reportar incidente" className="p-2 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-600 hover:text-white transition-colors">
                <FaExclamationCircle size={16} />
            </button>
        </div>
    );

    const openIncidentModal = (solicitud) => {
        setSelectedLoan(solicitud);
        setIncidentForm(prev => ({
            ...prev,
            titulo: `Incidente - ${solicitud.nombre_equipo}`,
            descripcion: '',
            id_laboratorio: solicitud?.id_laboratorio ?? null,
            accion_tomada: ''
        }));
        setIncidentModalOpen(true);
    };

    const closeIncidentModal = () => {
        setIncidentModalOpen(false);
        setSelectedLoan(null);
        setIncidentForm({ titulo: '', descripcion: '', id_laboratorio: null, accion_tomada: '' });
    };

    const submitIncident = async (e) => {
        e.preventDefault();
        if (!selectedLoan) return;
        try {
            setIsSubmittingIncident(true);
            await api.post('/api/incidents', {
                titulo: incidentForm.titulo,
                descripcion: incidentForm.descripcion,
                id_laboratorio: incidentForm.id_laboratorio || null,
                id_equipo: selectedLoan.id_equipo,
                id_componente: null,
                accion_tomada: incidentForm.accion_tomada || null,
            });
            globalThis.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: 'Incidente reportado correctamente' }}));
            closeIncidentModal();
        } catch (err) {
            globalThis.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: `Error al reportar incidente: ${err.message}` }}));
        } finally {
            setIsSubmittingIncident(false);
        }
    };

    // Actualización en tiempo real: escucha eventos y hace polling ligero
    useEffect(() => {
        let intervalId;

        const refreshData = async () => {
            try {
                const [sols, eqs] = await Promise.all([
                    api.get('/api/loansEquipment'),
                    api.get('/api/equipment')
                ]);

                // Actualiza solicitudes
                setSolicitudes(Array.isArray(sols) ? sols : []);

                // Actualiza inventario de equipos (mapa id -> cantidad)
                const map = {};
                if (Array.isArray(eqs)) {
                    for (const e of eqs) {
                        map[e.id_equipo] = e.cantidad;
                    }
                }
                setEquiposMap(map);
            } catch (err) {
                console.warn('No se pudo actualizar datos en tiempo real:', err?.message || err);
            }
        };

        // Escucha el evento global emitido por otras vistas
        const onInventoryUpdated = () => refreshData();
        globalThis.addEventListener('inventory-updated', onInventoryUpdated);

        // Refresca al recuperar foco de la pestaña
        const onVisibilityChange = () => { if (!document.hidden) refreshData(); };
        document.addEventListener('visibilitychange', onVisibilityChange);

        // Polling cada 15 segundos para evitar saturar el backend
        intervalId = setInterval(refreshData, 15000);

        return () => {
            globalThis.removeEventListener('inventory-updated', onInventoryUpdated);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            if (intervalId) clearInterval(intervalId);
        };
    }, []);

    

    const renderTableContent = () => {
        if (isLoading) return <Loader colSpan={colCount} />;
        if (error) return <tr key="error"><td colSpan={colCount} className="text-center py-4 text-red-500">{error}</td></tr>;
        if (filteredSolicitudes.length === 0) return <tr key="no-data"><td colSpan={colCount} className="text-center py-4">No hay solicitudes para mostrar.</td></tr>;

        return currentItems.map((solicitud) => {
            const { text, className } = getEstadoInfo(solicitud);
            const stockActual = equiposMap[solicitud.id_equipo];
            const delta = solicitud.cantidad;
            const isPendiente = solicitud.estado_aprobacion === 0;
            const isAceptado = solicitud.estado_aprobacion === 1;
            const previsto = typeof stockActual === 'number' ? stockActual - delta : undefined;
            return (
                <tr key={solicitud.id_prestamoE} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-5 font-medium">{solicitud.nombre_usuario}</td>
            
                    <td className="py-3 px-5">{solicitud.matricula || 'N/A'}</td>
                    {showCareer && (<td className="py-3 px-5">{solicitud.carrera || 'N/A'}</td>)}
                    <td className="py-3 px-5">
                        <div className="flex items-center gap-2">
                            <span className="font-medium">{solicitud.nombre_equipo}</span>
                            <button
                                title="Ver motivo"
                                onClick={() => {
                                    const fecha = new Date(solicitud.fecha_prestamo);
                                    setInfoItems([
                                        { label: 'Motivo', value: solicitud.motivo || 'Sin motivo especificado' },
                                        { label: 'Correo', value: solicitud.correo || 'N/A' },
                                        { label: 'Carrera', value: solicitud.carrera || 'N/A' },
                                        { label: 'Fecha', value: fecha.toLocaleDateString() },
                                        { label: 'Hora', value: fecha.toLocaleTimeString() },
                                        { label: 'Cantidad', value: String(solicitud.cantidad) }
                                    ]);
                                    setInfoOpen(true);
                                }}
                                className="p-1 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
                            >
                                <FaInfoCircle size={14} />
                            </button>
                        </div>
                    </td>
                    <td className="py-3 px-5 text-center">{solicitud.cantidad}</td>
                    <td className="py-3 px-5 text-center">
                        {typeof stockActual !== 'number' ? (
                            <span className="text-gray-400">-</span>
                        ) : (
                            <span className="text-gray-800">{typeof stockActual === 'number' ? stockActual : '-'}</span>
                        )}
                    </td>
                    <td className="py-3 px-5">
                        <span className={`inline-block whitespace-nowrap px-2 py-1 text-xs font-semibold rounded-full ${className}`}>
                            {text}
                        </span>
                    </td>
                    <td className="py-3 px-5 text-center">
                        {renderActions(solicitud)}
                    </td>
                    <td className="py-3 px-5 text-center">
                        {renderIncidentButton(solicitud)}
                    </td>
                </tr>
            );
        });
    };

    return (
        <div className='flex flex-col min-h-full justify-between'>
        <div className='flex-grow pb-4'>
            <div className="flex justify-end mb-4">
                <div className="relative">
                    <button onClick={() => setIsFiltroOpen(!isFiltroOpen)} className="flex items-center bg-white border border-gray-300 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
                        <FiFilter className="mr-2" />
                        Filtro
                    </button>
                    {isFiltroOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                            <a onClick={() => { setFiltroActivo('todos'); setIsFiltroOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Todos</a>
                            <a onClick={() => { setFiltroActivo(0); setIsFiltroOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Pendientes</a>
                            <a onClick={() => { setFiltroActivo(1); setIsFiltroOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Aceptados</a>
                            <a onClick={() => { setFiltroActivo(2); setIsFiltroOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Rechazados</a>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="min-w-full w-full">
                    <thead>
                        <tr className="bg-gray-100 text-left text-gray-600 uppercase text-sm">
                            <th className="py-3 px-5 font-semibold">Usuario</th>
          
                            <th className="py-3 px-5 font-semibold">Matrícula</th>
                            {showCareer && (<th className="py-3 px-5 font-semibold">Carrera</th>)}
                            <th className="py-3 px-5 font-semibold">Equipo Solicitado</th>
                            <th className="py-3 px-5 font-semibold text-center">Cantidad</th>
                            <th className="py-3 px-5 font-semibold text-center">Inventario</th>
                            <th className="py-3 px-5 font-semibold">Estado</th>
                            <th className="py-3 px-5 font-semibold text-center">Acciones</th>
                            <th className="py-3 px-5 font-semibold text-center">Incidente</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        {renderTableContent()}
                    </tbody>
                </table>
            </div>
        </div>

        <div className='mt-4'>
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />
        </div>

        <InfoModal
            isOpen={infoOpen}
            onClose={() => setInfoOpen(false)}
            title="Detalles del préstamo"
            items={infoItems}
        />

        {incidentModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Reportar incidente</h3>
                    <form onSubmit={submitIncident}>
                        <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700">Título</label>
                            <input
                                type="text"
                                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                                value={incidentForm.titulo}
                                onChange={(e) => setIncidentForm({ ...incidentForm, titulo: e.target.value })}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700">Descripción</label>
                            <textarea
                                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                                rows={4}
                                value={incidentForm.descripcion}
                                onChange={(e) => setIncidentForm({ ...incidentForm, descripcion: e.target.value })}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700">Laboratorio</label>
                            <select
                                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                                value={incidentForm.id_laboratorio ?? ''}
                                onChange={(e) => setIncidentForm({ ...incidentForm, id_laboratorio: e.target.value ? Number(e.target.value) : null })}
                            >
                                <option value="">Selecciona un laboratorio (opcional)</option>
                                {laboratorios.map(lab => (
                                    <option key={lab.id_laboratorio} value={lab.id_laboratorio}>{lab.nombre_laboratorio}</option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Acción tomada (opcional)</label>
                            <input
                                type="text"
                                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                                value={incidentForm.accion_tomada}
                                onChange={(e) => setIncidentForm({ ...incidentForm, accion_tomada: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button type="button" onClick={closeIncidentModal} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100">Cancelar</button>
                            <button type="submit" disabled={isSubmittingIncident} className="px-4 py-2 rounded-md bg-amber-600 text-white hover:bg-amber-700">
                                {isSubmittingIncident ? 'Enviando...' : 'Reportar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        </div>
    );
};

export default LoansEquipment;
