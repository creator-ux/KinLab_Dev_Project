import React, { useEffect, useState } from 'react';
import { api } from '../../../apiClient.js';
import PropTypes from 'prop-types';

function AddComponent({ onClose, onComponentAdded }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [subcategoria, setSubcategoria] = useState('');
  
  //Nuevo estado para guardar el archivo de la imagen y su previsualización
  const [imagenArchivo, setImagenArchivo] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);

  //Manejador para el input de la imagen
  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagenArchivo(file); // Guardamos el archivo
      setImagenPreview(URL.createObjectURL(file)); // Creamos una URL para la previsualización
    }
  };

  //Guardar lista de las subcategorias
  const [subcategoriasList, setSubcategoriasList] = useState([]);

  useEffect(() => {

    const fetchSubcategorias = async () => {
        try{
            const data = await api.get('/api/subcategory');
            setSubcategoriasList(data);
        } catch (error){
            console.error(error);
        }
    };
    fetchSubcategorias();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let idImagen = null;

    //PASO 1: Subir la imagen si existe
    if (imagenArchivo) {
      const formData = new FormData();
      formData.append('imagen', imagenArchivo); // La clave 'imagen' debe coincidir con la del backend

      try {
        const dataImg = await api.upload('/api/images', formData);
        idImagen = dataImg.id_imagen; // Guardamos el ID de la imagen subida
      }catch (error){
        console.error("Hubo un error al subir la imagen:", error);
        globalThis.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: 'No se pudo subir la imagen. Inténtalo de nuevo.' }}));
        return; // Detenemos el proceso si la imagen no se puede subir
      }
    }
      try{
        // PASO 2: Guardar los datos del equipo con el id_imagen
        const nuevoComponente = {
          nombre_componente: nombre,
          descripcion: descripcion,
          cantidad: Number.parseInt(cantidad, 10),
          id_subcategoria: Number.parseInt(subcategoria, 10),
          id_imagen: idImagen, // Usamos el ID de la imagen (puede ser null si no se subió una)
        };
        const componentAgregado = await api.post('/api/component', nuevoComponente);
        onComponentAdded(componentAgregado);
        globalThis.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: 'Componente agregado correctamente' }}));
        onClose();

      }catch (error) {
      console.error("Hubo un error al guardar el componente:", error);
      globalThis.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: `Error: ${error.message}` }}));
      }
};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl z-50 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Agregar Componente</h2>
        <form onSubmit={handleSubmit}>
          {/* ... Campos de Nombre, Cantidad, Laboratorio, Descripción (no cambian) ... */}
          <div className="mb-4">
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre del Componente</label>
            <input 
                type="text" 
                id="nombre" 
                value={nombre} 
                onChange={(e) => setNombre(e.target.value)} 
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" 
                required />
          </div>
          <div className="mb-4">
            <label htmlFor="cantidad" className="block text-sm font-medium text-gray-700">Cantidad</label>
            <input 
                type="number" 
                id="cantidad" 
                value={cantidad} onChange={(e) => setCantidad(e.target.value)} 
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" 
                required min="0" />
          </div>
          <div className="mb-4">
            <label htmlFor="subcategoria" className="block text-sm font-medium text-gray-700">Subcategoria</label>
            <select 
                id="subcategoria" 
                value={subcategoria} 
                onChange={(e) => setSubcategoria(e.target.value)} 
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" 
                required>
              <option value="">Seleccione</option>
              {subcategoriasList.map((sub) => (
                <option
                    key = {sub.id_subcategoria}
                    value = {sub.id_subcategoria}>
                    {sub.nombre_subcategoria}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">Descripción</label>
            <textarea 
                id="descripcion" 
                value={descripcion} 
                onChange={(e) => setDescripcion(e.target.value)} 
                rows="3" 
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"></textarea>
          </div>
          
          {/* --- 3. NUEVO CAMPO PARA SUBIR IMAGEN --- */}
          <div className="mb-4">
            <label htmlFor="imagen" className="block text-sm font-medium text-gray-700">Imagen del Componente</label>
            <input
              type="file"
              id="imagen"
              onChange={handleImagenChange}
              accept="image/png, image/jpeg, image/webp"
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {/* Previsualización de la imagen */}
          {imagenPreview && (
            <div className="mb-4">
              <img 
                src={imagenPreview} 
                alt="Previsualización" 
                className="w-32 h-32 object-cover rounded-md mx-auto"/>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button 
                type="button" 
                onClick={onClose} 
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50">
              Cancelar
            </button>
            <button 
                type="submit" 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

AddComponent.propTypes = {
  onClose: PropTypes.func.isRequired,
  onComponentAdded: PropTypes.func.isRequired,
};

export default AddComponent;