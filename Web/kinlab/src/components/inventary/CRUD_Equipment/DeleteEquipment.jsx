import React from 'react';
import PropTypes from 'prop-types';

// onConfirm: La función que se ejecuta si el usuario confirma.
// onCancel: La función que se ejecuta si el usuario cancela.
// message: El mensaje de confirmación que se mostrará.
function DeleteEquipment({onConfirm, onCancel, message}){

    return (
        <div className='fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center'>
            <div className='bg-white p-6 rounded-lg shadow-xl z-50 w-full max-w-sm text-center'>
                <h2 className='text-lg font-bold mb-4'>¿ESTAS SEGURO?</h2>
                <p className='text-gray-700 mb-6'>{message}</p>
                <div className='flex justify-center space-x-4'>
                    <button onClick={onCancel} 
                        className='bg-gray-200 text-gray-800 px-6 py-2 rounded-lg 
                        hover:bg-gray-400 
                        hover:text-white 
                        transition-colors duration-200'>
                        Cancelar
                    </button>
                    <button onClick={onConfirm} 
                        className='bg-gray-200 
                        text-gray-800 px-6 py-2 
                        rounded-lg 
                        hover:bg-red-600 
                        hover:text-white 
                        transition-colors duration-200'>
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}

DeleteEquipment.propTypes = {
    onConfirm: PropTypes.func.isRequired, 
    onCancel: PropTypes.func.isRequired, 
    message: PropTypes.string.isRequired,
};

export default DeleteEquipment;
