import React, { useState, useEffect } from 'react';
import { api } from '../../apiClient.js';
import PropTypes from 'prop-types';

function AddSubcategory({ onClose }) {
    const [nombre, setNombre] = useState('');
    const [categoriaId, setCategoriaId] = useState('');
    const [categorias, setCategorias] = useState([]);

    useEffect(() => {
        const fetchCategorias = async () => {
            try {
                const data = await api.get('/api/category');
                setCategorias(data);
            } catch (err) {
                console.error('Error al cargar categorías', err);
            }
        };
        fetchCategorias();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/subcategory', { nombre_subcategoria: nombre, id_categoria: categoriaId });
            globalThis.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: 'Subcategoría agregada con éxito' }}));
            onClose();
        } catch (error) {
            globalThis.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: `Error: ${error.message}` }}));
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-xl z-50 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Nueva Subcategoría</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre de la Subcategoría</label>
                        <input 
                            type="text" 
                            id="nombre" 
                            value={nombre} 
                            onChange={(e) => setNombre(e.target.value)} 
                            className="mt-1 block w-full border rounded-md p-2" 
                            required />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="categoria" className="block text-sm font-medium text-gray-700">Categoría</label>
                        <select 
                            id="categoria" 
                            value={categoriaId} 
                            onChange={(e) => setCategoriaId(e.target.value)} 
                            className="mt-1 block w-full border rounded-md p-2" 
                            required>
                            <option value="">Seleccione una categoría</option>
                            {categorias.map(cat => (
                                <option 
                                    key={cat.id_categoria} 
                                    value={cat.id_categoria}>{cat.nombre_categoria}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="bg-gray-200 px-4 py-2 rounded-lg">
                                Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                                Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

AddSubcategory.propTypes = {
    onClose: PropTypes.func.isRequired,
};
export default AddSubcategory;