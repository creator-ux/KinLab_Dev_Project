import React, { useState, useEffect } from 'react';
import { api } from '../../apiClient.js';
import PropTypes from 'prop-types';

function AddCategory({ onClose }) {
    const [nombre, setNombre] = useState('');
    const [laboratorioId, setLaboratorioId] = useState('');
    const [laboratorios, setLaboratorios] = useState([]);

    useEffect(() => {
        const fetchLaboratorios = async () => {
            try {
                const data = await api.get('/api/laboratory');
                setLaboratorios(data);
            } catch (err) {
                console.error('Error al cargar laboratorios', err);
            }
        };
        fetchLaboratorios();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/category', { nombre_categoria: nombre, id_laboratorio: laboratorioId });
            globalThis.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: 'Categoría agregada con éxito' }}));
            onClose();
        } catch (error) {
            globalThis.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: `Error: ${error.message}` }}));
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-xl z-50 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Nueva Categoría</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre de la Categoría</label>
                        <input 
                            type="text" 
                            id="nombre" 
                            value={nombre} 
                            onChange={(e) => setNombre(e.target.value)} 
                            className="mt-1 block w-full border rounded-md p-2" 
                            required />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="laboratorio" className="block text-sm font-medium text-gray-700">Laboratorio</label>
                        <select 
                            id="laboratorio" 
                            value={laboratorioId} 
                            onChange={(e) => setLaboratorioId(e.target.value)} 
                            className="mt-1 block w-full border rounded-md p-2" 
                            required>
                            <option value="">Seleccione un laboratorio</option>
                            {laboratorios.map(lab => (
                                <option key={lab.id_laboratorio} value={lab.id_laboratorio}>{lab.nombre_laboratorio}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="bg-gray-200 px-4 py-2 rounded-lg">Cancelar</button>
                        <button 
                            type="submit" 
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

AddCategory.propTypes = {
    onClose: PropTypes.func.isRequired,
};
export default AddCategory;