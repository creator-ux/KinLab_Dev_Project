import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { FaUserCircle, FaSignOutAlt, FaBox, FaChevronDown, FaChevronUp, FaHistory, FaExclamationTriangle, FaHome, FaFlask, FaClipboardList, FaTools, FaMicrochip } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth.js'; 
import { canAccessAreas, canAccessHistory } from '../utils/permissions.js';
// Iconos de FA unificados para coherencia visual
import { api } from '../apiClient.js';
import { MdOutlineFactCheck } from "react-icons/md";
import { SiAwsfargate } from "react-icons/si";
import { HiUsers } from "react-icons/hi2";

function DashboardLayout (){
    const { user, logout } = useAuth();
    const location = useLocation();

    const [isReportsOpen, setIsReportsOpen] = useState(false);
    const [isLoansOpen, setIsLoansOpen] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    const idleTimerRef = useRef(null);
    // 10 minutos, 60 segundos
    const IDLE_TIMEOUT = 20 * 60 * 1000; //cuenta regresiva de inactividad para cerrar la sesio¿ón

    const resetIdleTimer = useCallback(() => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }

      idleTimerRef.current = setTimeout(() => {
        console.log('Cerrando sesión por inactividad.')
        if (user){
          logout();
        }
      }, IDLE_TIMEOUT);
    }, [logout, user, IDLE_TIMEOUT]);

    useEffect(() => {
      resetIdleTimer();
      const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];

      for (const event of events) {
        globalThis.addEventListener(event, resetIdleTimer);
      }

      return () => {
        if (idleTimerRef.current){
          clearTimeout(idleTimerRef.current);
        }

        for (const event of events) {
          globalThis.removeEventListener(event, resetIdleTimer);
        }
      };
    }, [resetIdleTimer]);

    const activeLinkStyle = "flex items-center py-2 px-3 rounded-md bg-gray-700 text-white font-bold shadow-inner";
    const inactiveLinkStyle = "flex items-center py-2 px-3 rounded-md text-gray-700 hover:bg-gray-300 hover:text-gray-900 transition duration-100";

    const isHomeActive = location.pathname === '/home';
    const isAreasActive = location.pathname.startsWith('/home/areas');
    const isUsersActive = location.pathname.startsWith('/home/users')
    const isInventaryActive = location.pathname.startsWith('/home/inventary');
    const isLoansActive = location.pathname.startsWith('/home/loans');
    const isReportsActive = location.pathname.startsWith('/home/reports');

    // Carga el conteo de solicitudes pendientes y se actualiza ante cambios
    useEffect(() => {
      let isMounted = true;

      const fetchPendingCount = async () => {
        try {
          const [equipos, componentes] = await Promise.all([
            api.get('/api/loansEquipment'),
            api.get('/api/loansComponents')
          ]);
          const countEquipos = Array.isArray(equipos) ? equipos.filter(s => s.estado_aprobacion === 0).length : 0;
          const countComponentes = Array.isArray(componentes) ? componentes.filter(s => s.estado_aprobacion === 0).length : 0;
          if (isMounted) setPendingCount(countEquipos + countComponentes);
        } catch {
          // En caso de error (por ejemplo backend no disponible), no romper UI
          console.error('Error al cargar conteo de solicitudes pendientes');
          if (isMounted) setPendingCount(0);
        }
      };

      // Cargar al inicio
      fetchPendingCount();

      // Actualizar cuando el inventario/solicitudes cambien
      const onInventoryUpdated = () => fetchPendingCount();
      globalThis.addEventListener('inventory-updated', onInventoryUpdated);

      return () => {
        isMounted = false;
        globalThis.removeEventListener('inventory-updated', onInventoryUpdated);
      };
    }, []);

    useEffect(() => {
      if (isLoansActive) {
        setIsLoansOpen(true);
      }
    }, [isLoansActive]);

    return (
         <div className="flex h-screen bg-gray-100">
      
      <div className="w-64 bg-gray-200 text-gray-800 flex flex-col shadow-lg border-r border-gray-300">
        
        <div className="flex items-center justify-between p-4 bg-gray-300 border-b border-gray-400">
          <div className="flex items-center">
            <FaUserCircle className="text-2xl mr-2 text-gray-700" />
            <span className="font-semibold text-lg text-gray-800">{user ? user.nombre : 'Invitado'} </span>
          </div>
          <button
            className="flex items-center px-4 py-2 text-gray hover:text-white focus:outline-none rounded-lg hover:bg-gray-600 shadow"
            title="Cerrar Sesión"
            onClick={logout}
          >
            <FaSignOutAlt className="text-xl transform rotate-180" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">

          <Link
            to="/home"
            className={isHomeActive ? activeLinkStyle : inactiveLinkStyle}
          >
            <FaHome className="mr-3" size={20} />
              Inicio
          </Link>
          {canAccessAreas(user) && (
            <Link
              to="/home/areas"
              className={isAreasActive ? activeLinkStyle : inactiveLinkStyle}
            >
              <FaFlask className="mr-3" />
              Áreas
            </Link>
          )}
          <Link
            to = "/home/users"
            className={isUsersActive ? activeLinkStyle : inactiveLinkStyle}
          >
            <HiUsers className="mr-3" />
            Usuarios
          </Link>
          <Link
            to="/home/inventary"
            className={isInventaryActive ? activeLinkStyle : inactiveLinkStyle}
          >
            <FaBox className="mr-3" />
            Inventario
          </Link>
          <div>
            <button 
              onClick={() => setIsLoansOpen(!isLoansOpen)}
              className={`${isLoansActive ? activeLinkStyle : inactiveLinkStyle} w-full flex justify-between items-center`}
            >
              <div className="flex items-center">
                <FaClipboardList className="mr-3" />
                <span>Solicitudes</span>
              </div>
              <div className="flex items-center gap-2">
                {pendingCount > 0 && (
                  <span className="inline-flex items-center justify-center text-[10px] font-bold text-white bg-red-600 rounded-full w-5 h-5">
                    {pendingCount}
                  </span>
                )}
                {isLoansOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
              </div>
            </button>
            {isLoansOpen && (
              <div className="pl-6 mt-2 space-y-2 border-l-2 border-gray-400 ml-3">
                <Link 
                  to="/home/loans?tab=equipos" 
                  className={`flex items-center text-sm py-1 ${location.pathname === '/home/loans' && new URLSearchParams(location.search).get('tab') === 'equipos' ? 'text-blue-600 font-bold' : 'text-gray-600 hover:text-black'}`}
                >
                  <FaTools className="mr-3" /> Equipos
                </Link>
                <Link 
                  to="/home/loans?tab=componentes" 
                  className={`flex items-center text-sm py-1 ${location.pathname === '/home/loans' && new URLSearchParams(location.search).get('tab') === 'componentes' ? 'text-blue-600 font-bold' : 'text-gray-600 hover:text-black'}`}
                >
                  <FaMicrochip className="mr-3" /> Componentes
                </Link>
                <Link 
                    to="/home/loans/loansStatus" 
                    className={`flex items-center text-sm py-1 ${location.pathname === '/home/loans/loansStatus' ? 'text-blue-600 font-bold' : 'text-gray-600 hover:text-black'}`}
                  >
                    <SiAwsfargate className="mr-3" /> Estado de préstamo
                </Link>
              </div>
            )}
          </div>
          <div>
            <button 
              onClick={() => setIsReportsOpen(!isReportsOpen)}
              className={`${isReportsActive ? activeLinkStyle : inactiveLinkStyle} w-full flex justify-between items-center`}
            >
            <div className="flex items-center">
              <MdOutlineFactCheck className="mr-3" />
                <span>Reportes</span>
            </div>
              {isReportsOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
            </button>
              {isReportsOpen && (
                <div className="pl-6 mt-2 space-y-2 border-l-2 border-gray-400 ml-3">
                  {canAccessHistory(user) && (
                    <Link 
                      to="/home/reports/record" 
                      className={`flex items-center text-sm py-1 ${location.pathname === '/home/reports/record' ? 'text-blue-600 font-bold' : 'text-gray-600 hover:text-black'}`}
                    >
                      <FaHistory className="mr-3" /> Historial
                    </Link>
                  )}

                  <Link 
                    to="/home/reports/incidents" 
                    className={`flex items-center text-sm py-1 ${location.pathname === '/home/reports/incidents' ? 'text-blue-600 font-bold' : 'text-gray-600 hover:text-black'}`}
                  >
                    <FaExclamationTriangle className="mr-3" /> Incidentes
                  </Link>

                </div>
              )}
          </div>
        </nav>
      </div>

      <div className="flex-1 p-6 bg-gray-100 overflow-auto flex flex-col">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 flex flex-col flex-1">

          <Outlet /> 
        </div>
      </div>
    </div>
    );
}

export default DashboardLayout;
