import React, { useContext } from 'react';
import Card from '../components/common/Card';
import { FaCommentDots, FaRegCommentDots, FaFlask } from 'react-icons/fa';
import { FaComputer, FaTriangleExclamation } from 'react-icons/fa6';
import { TbComponents } from 'react-icons/tb'
import { RiFileHistoryLine } from 'react-icons/ri';
import { AnimatedTitle } from '../components/common/AnimatedTitle';
import { SiAwsfargate } from "react-icons/si";
import { HiUsers } from "react-icons/hi2";
import { AuthContext } from '../context/AuthContext.jsx';
import { canAccessAreas, canAccessHistory } from '../utils/permissions.js'; //isAdminLevel <-lo elimine porque si queria que se vea la card de usuarios

function HomePage (){
    const { user } = useContext(AuthContext);
    const showAreas = canAccessAreas(user); // sólo admin nivel 0
    const showHistory = canAccessHistory(user);
    //const showUsuarios = isAdminLevel(user, 0); // sólo admin nivel 0

    return(
    <div className='h-full'>
        <div className="h-12 flex items-center mb-4">
            <AnimatedTitle texts={["PANEL DE ADMINISTRADOR", "MODULOS DEL LABORATORIO"]} speed={100} />
        </div>

        <h2 className="text-lg font-semibold text-gray-600 mb-10">
            GESTIONE DE LA MEJOR MANERA SU LABORATORIO
        </h2>

        <div className="mx-auto max-w-6xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10 justify-items-center">
            <Card
                title="Equipos"
                description=""
                icon={FaComputer}
                to="/home/inventary?tab=equipos"
            />
            <Card
                title="Componentes"
                description=""
                icon={TbComponents}
                to="/home/inventary?tab=componentes"
            />
            <Card
                title="Préstamo de equipos"
                description=""
                icon={FaCommentDots}
                to="/home/loans?tab=equipos"
            />
            <Card
                title="Préstamo de componentes"
                description=""
                icon={FaRegCommentDots}
                to="/home/loans?tab=componentes"
            />
            {showHistory && (
                <Card
                    title="Historial"
                    description=""
                    icon={RiFileHistoryLine}
                    to="/home/reports/record"
                />
            )}
            <Card
                title=  "Incidentes"
                description=""
                icon={FaTriangleExclamation}
                to="/home/reports/incidents"
            />
            {showAreas && (
                <Card
                    title="Laboratorios"
                    description=""
                    icon={FaFlask}
                    to="/home/areas"
                />
            )}
            <Card
                title="Estado de préstamos"
                description=""
                icon={SiAwsfargate}
                to="/home/loans/loansStatus"
            />
            <Card
                title="Usuarios"
                description=""
                icon={HiUsers}
                to="/home/users"
            />
            

        </div>

        <br/>
        <br/>
        <div className="mx-auto max-w-6xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 justify-items-center">
           
        </div>
    </div>
    
    );

}

export default HomePage;