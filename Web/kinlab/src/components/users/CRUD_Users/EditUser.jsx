import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { api } from '../../../apiClient';

/**
 * Modal para EDITAR un usuario existente.
 * Actualizado para coincidir con la API de admin.
 */
function EditUser({ onClose, onUserUpdated, usuarioToEdit }) {
  const [nombre, setNombre] = useState('');
  const [apellidoPaterno, setApellidoPaterno] = useState('');
  const [apellidoMaterno, setApellidoMaterno] = useState('');
  // Permisos
  const [permisos, setPermisos] = useState([]);
  const [permisoId, setPermisoId] = useState(null);
  const [matricula, setMatricula] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [telefonoError, setTelefonoError] = useState(null);
  const [contrasena, setContrasena] = useState(''); // Opcional
  const [showPassword, setShowPassword] = useState(false);
  // Ladas (códigos de país)
  const ladas = [
    { codigo: "+52", pais: "MX" },
    { codigo: "+1", pais: "US/CA" },
    { codigo: "+34", pais: "ES" },
    { codigo: "+54", pais: "AR" },
    { codigo: "+57", pais: "CO" },
    { codigo: "+56", pais: "CL" },
  ];
  const [lada, setLada] = useState('+52');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Llenar el formulario con los datos del usuario a editar
  useEffect(() => {
    if (usuarioToEdit) {
      setNombre(usuarioToEdit.nombre || '');
      setApellidoPaterno(usuarioToEdit.apellido_paterno || '');
      setApellidoMaterno(usuarioToEdit.apellido_materno || '');
      setPermisoId(usuarioToEdit.id_permiso || null);
      setMatricula(usuarioToEdit.matricula || '');
      setCorreo(usuarioToEdit.correo || '');
      const telFull = (usuarioToEdit.telefono || '').toString();
      const ladaMatch = ladas.find(l => telFull.startsWith(l.codigo));
      if (ladaMatch) {
        setLada(ladaMatch.codigo);
        setTelefono(telFull.slice(ladaMatch.codigo.length).replace(/\D/g, '').slice(0, 10));
      } else {
        setTelefono(telFull.replace(/\D/g, '').slice(0, 10));
      }
      // No prellenar la contraseña: solo cambiar si el usuario escribe una nueva
      setContrasena('');
      
    }
  }, [usuarioToEdit]);

  // Cargar permisos para poblar el select
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await api.get('/api/permissions');
        if (!mounted) return;
        setPermisos(data || []);
        // Si no hay permisoId aún (usuario sin id_permiso), seleccionar primero del listado
        if (!permisoId && data?.length) {
          setPermisoId(data[0].id_permiso);
        }
      } catch (err) {
        console.error('No se pudieron cargar permisos:', err);
      }
    })();
    return () => { mounted = false; };
  }, [permisoId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validación: número de teléfono debe tener exactamente 10 dígitos
    const telDigits = (telefono || '').trim();
    if (telDigits.length !== 10) {
      setIsLoading(false);
      setTelefonoError('El número debe tener exactamente 10 dígitos');
      globalThis.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: 'El teléfono debe tener 10 dígitos.' }}));
      return;
    }
    setTelefonoError(null);

    const userData = {
      nombre,
      apellido_paterno: apellidoPaterno,
      apellido_materno: apellidoMaterno,
      id_permiso: permisoId,
      matricula: matricula.trim() === '' ? null : matricula,
      correo,
      telefono: `${lada}${telefono}`,
    };

    // Solo enviar contraseña si el usuario escribió una nueva
    if (contrasena && contrasena.trim() !== '') {
      userData.contrasena = contrasena;
    }

    try {
      
      await api.put(`/api/users/${usuarioToEdit.id_usuario}`, userData);
      
      globalThis.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: `Usuario actualizado: ${nombre} ${apellidoPaterno}` }}));
      globalThis.dispatchEvent(new CustomEvent('user-updated'));
      onUserUpdated(); // Cierra el modal

    } catch (err) {
      setError(err.message || "No se pudo actualizar el usuario.");
      globalThis.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: `Error al actualizar usuario: ${err.message || 'desconocido'}` }}));
      setIsLoading(false); // Mantener el modal abierto si hay error
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center"
      onClick={onClose} 
    >
      <div 
        className="bg-white p-6 rounded-lg shadow-xl z-50 w-full max-w-lg"
        onClick={e => e.stopPropagation()} 
      >
        <h2 className="text-2xl font-bold mb-4">Editar Usuario</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Fila para Nombres */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="edit_nombre_usuario" className="block text-sm font-medium text-gray-700">Nombre(s)</label>
              <input 
                type="text" 
                id="edit_nombre_usuario" 
                value={nombre} 
                onChange={(e) => setNombre(e.target.value)} 
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" 
                required 
              />
            </div>
            <div>
              <label htmlFor="edit_apellido_paterno" className="block text-sm font-medium text-gray-700">Apellido Paterno</label>
              <input 
                type="text" 
                id="edit_apellido_paterno" 
                value={apellidoPaterno} 
                onChange={(e) => setApellidoPaterno(e.target.value)} 
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" 
                required 
              />
            </div>
            <div>
              <label htmlFor="edit_apellido_materno" className="block text-sm font-medium text-gray-700">Apellido Materno</label>
              <input 
                type="text" 
                id="edit_apellido_materno" 
                value={apellidoMaterno} 
                onChange={(e) => setApellidoMaterno(e.target.value)} 
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" 
                required 
              />
            </div>
          </div>
          
          {/* Fila para Correo y Teléfono */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit_correo" className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
              <input 
                type="email" 
                id="edit_correo" 
                value={correo} 
                onChange={(e) => setCorreo(e.target.value)} 
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" 
                required 
              />
            </div>
            <div>
              <label htmlFor="edit_telefono" className="block text-sm font-medium text-gray-700">Teléfono</label>
              <div className="mt-1 flex items-center gap-2 w-full">
                <select
                  aria-label="Código de país"
                  value={lada}
                  onChange={(e) => setLada(e.target.value)}
                  className="border border-gray-300 rounded-md shadow-sm py-2 px-3 w-24 whitespace-nowrap text-sm"
                >
                  {ladas.map(op => (
                    <option key={op.codigo} value={op.codigo}>{op.codigo} {op.pais}</option>
                  ))}
                </select>
                <input 
                  type="tel" 
                  id="edit_telefono" 
                  value={telefono} 
                  onChange={(e) => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                  onInvalid={(e) => e.target.setCustomValidity('El teléfono debe tener 10 dígitos')} 
                  onInput={(e) => e.target.setCustomValidity('')} 
                  className="flex-1 min-w-0 border border-gray-300 rounded-md shadow-sm py-2 px-3" 
                  required 
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  title="El teléfono debe tener 10 dígitos"
                  placeholder=""
                />
              </div>
              {telefonoError ? (
                <p className="mt-1 text-xs text-red-600">{telefonoError}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">Ingresa tu número telefónico.</p>
              )}
            </div>
          </div>

          {/* Fila para Matrícula y Tipo (permiso) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit_matricula" className="block text-sm font-medium text-gray-700">Matrícula</label>
              <input 
                type="text" 
                id="edit_matricula" 
                value={matricula} 
                onChange={(e) => setMatricula(e.target.value)} 
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                
              />
            </div>
            <div>
              <label htmlFor="edit_permiso" className="block text-sm font-medium text-gray-700">Tipo</label>
              <select
                id="edit_permiso"
                value={permisoId ?? ''}
                onChange={(e) => setPermisoId(parseInt(e.target.value, 10))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                required
              >
                {permisos.length === 0 ? (
                  <option value="" disabled>Sin permisos disponibles</option>
                ) : (
                  permisos.map(p => (
                    <option key={p.id_permiso} value={p.id_permiso}>
                      {p.tipo.charAt(0).toUpperCase() + p.tipo.slice(1)} (Nivel {p.nivel})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
          
          {/* Contraseña Opcional */}
          <div className="pt-2 relative">
            <label htmlFor="edit_contrasena" className="block text-sm font-medium text-gray-700">Nueva Contraseña (Opcional)</label>
              <input 
                type={showPassword ? 'text' : 'password'} 
                id="edit_contrasena" 
                value={contrasena} 
                onChange={(e) => setContrasena(e.target.value)} 
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                placeholder="Nueva Contraseña"
              />
              <button
                type="button"
                aria-pressed={showPassword}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm"
                style={{ position: 'absolute', right: '8px', top: '72%', color: '#6B7280' }}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" shapeRendering="geometricPrecision">
                    <path d="M2 2l20 20" vectorEffect="non-scaling-stroke"/>
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C5 20 1 12 1 12a21.81 21.81 0 0 1 5.06-6.06" vectorEffect="non-scaling-stroke"/>
                    <path d="M9.88 5.52A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.81 21.81 0 0 1-4.57 5.76" vectorEffect="non-scaling-stroke"/>
                    <path d="M12 15a3 3 0 1 0 0-6" vectorEffect="non-scaling-stroke"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" shapeRendering="geometricPrecision">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8" vectorEffect="non-scaling-stroke"/>
                    <circle cx="12" cy="12" r="3" vectorEffect="non-scaling-stroke"/>
                  </svg>
                )}
              </button>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center p-2 bg-red-50 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isLoading}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50">
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

EditUser.propTypes = {
  onClose: PropTypes.func.isRequired,
  onUserUpdated: PropTypes.func.isRequired,
  usuarioToEdit: PropTypes.object.isRequired,
};

export default EditUser;