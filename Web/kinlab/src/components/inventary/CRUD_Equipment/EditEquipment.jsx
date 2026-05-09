import React, {useState, useEffect} from 'react';
import { api } from '../../../apiClient.js';
import PropTypes from 'prop-types';

function EditEquipment({ equipoToEdit, onClose, onEquipoUpdated }){
    const [formData, setFormData] = useState({ ...equipoToEdit });

    //Guardar lista de los laboratorios
    const [laboratoriosList, setLaboratoriosList] = useState([]);

    // Imagen (opcional) para igualar UI de "Agregar"
    const [imagenArchivo, setImagenArchivo] = useState(null);
    const [imagenPreview, setImagenPreview] = useState(null);

  // Manejador de imagen
  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagenArchivo(file);
      setImagenPreview(URL.createObjectURL(file));
    }
  };

  // Sincroniza el estado del formulario si el equipo a editar cambia
  useEffect(() => {
    setFormData({ ...equipoToEdit });
  }, [equipoToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    
        const fetchLaboratorios = async () => {
            try{
                const data = await api.get('/api/laboratory');
                setLaboratoriosList(data);
            } catch (error){
                console.error(error);
            }
        };
        fetchLaboratorios();
      }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let idImagen = formData.id_imagen ?? null;
      // Subir imagen si el usuario seleccionó una nueva
      if (imagenArchivo) {
        const formImg = new FormData();
        formImg.append('imagen', imagenArchivo);
        const dataImg = await api.upload('/api/images', formImg);
        idImagen = dataImg.id_imagen;
      }

      const payload = {
        nombre_equipo: formData.nombre_equipo,
        descripcion: formData.descripcion,
        cantidad: parseInt(formData.cantidad ?? 0, 10),
        id_laboratorio: parseInt(formData.id_laboratorio ?? 0, 10),
        id_imagen: idImagen,
        // Preserva el estado actual del equipo para evitar que se vuelva NULL en el backend
        estado: (formData.estado ?? 'disponible')
      };

      await api.put(`/api/equipment/${formData.id_equipo}`, payload);

      onEquipoUpdated(formData); // Notifica al componente padre sobre la actualización
      globalThis.dispatchEvent(new CustomEvent('notify', { detail: { type: 'info', message: 'Equipo actualizado correctamente' }}));
      onClose(); // Cierra el modal

    } catch (error) {
      console.error("Error al actualizar:", error);
      globalThis.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: 'No se pudo actualizar el equipo.' }}));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl z-50 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Editar Equipo</h2>
        <form onSubmit={handleSubmit}>
          {/* Campo Nombre */}
          <div className="mb-4">
            <label htmlFor="nombre_equipo" className="block text-sm font-medium text-gray-700">Nombre del Equipo</label>
            <input
              type="text"
              name="nombre_equipo"
              id="nombre_equipo"
              value={formData.nombre_equipo || ''}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              required
            />
          </div>

          {/* Campo Cantidad */}
          <div className="mb-4">
            <label htmlFor="cantidad" className="block text-sm font-medium text-gray-700">Cantidad</label>
            <input
              type="number"
              name="cantidad"
              id="cantidad"
              value={formData.cantidad || 1}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              required
              min="0"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="laboratorio" className="block text-sm font-medium text-gray-700">Laboratorio</label>
            <select name='id_laboratorio'
                id='id_laboratorio'
                value={formData.id_laboratorio || ''}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required>
              <option value="">Seleccione</option>
              {laboratoriosList.map((labo) =>(
                <option
                key = {labo.id_laboratorio}
                value = {labo.id_laboratorio}>
                  {labo.nombre_laboratorio}
                </option>
              ))}
            </select>
          </div>

          {/* Campo Descripción */}
          <div className="mb-4">
             <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">Descripción</label>
             <textarea name="descripcion" id="descripcion" value={formData.descripcion || ''} onChange={handleChange} rows="3" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"></textarea>
          </div>

          {/* Campo de Imagen (opcional, igual al de Agregar) */}
          <div className="mb-4">
            <label htmlFor="imagen" className="block text-sm font-medium text-gray-700">Imagen del Equipo</label>
            <input
              type="file"
              id="imagen"
              onChange={handleImagenChange}
              accept="image/png, image/jpeg, image/webp"
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {imagenPreview && (
            <div className="mb-4">
              <img src={imagenPreview} alt="Previsualización" className="w-32 h-32 object-cover rounded-md mx-auto"/>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex justify-end space-x-3 mt-6">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">
              Cancelar
            </button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

EditEquipment.propTypes = {
  equipoToEdit: PropTypes.object.isRequired, 
  onClose: PropTypes.func.isRequired, 
  onEquipoUpdated: PropTypes.func.isRequired,
};

export default EditEquipment;