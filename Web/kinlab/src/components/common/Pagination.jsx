import React from 'react';
import PropTypes from 'prop-types';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// Este componente recibe 3 "instrucciones" (props) del componente padre:
// 1. currentPage: El número de la página actual.
// 2. totalPages: El número total de páginas.
// 3. onPageChange: La función para actualizar la página actual en el padre.
function Pagination({ currentPage, totalPages, onPageChange }) {
    
    const handlePrevious = () => {
        // Solo cambia de página si no es la primera
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        // Solo cambia de página si no es la última
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    return (
        <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-600">
                Página {currentPage} de {totalPages || 1}
            </span>
            <div className="flex space-x-2">
                <button
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FaChevronLeft className="inline-block mr-1" /> Anterior
                </button>
                <button
                    onClick={handleNext}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Siguiente <FaChevronRight className="inline-block ml-1" />
                </button>
            </div>
        </div>
    );
}

// Es una buena práctica definir los tipos de props que espera el componente
Pagination.propTypes = {
    currentPage: PropTypes.number.isRequired,
    totalPages: PropTypes.number.isRequired,
    onPageChange: PropTypes.func.isRequired,
};

export default Pagination;
