import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { api } from '../../../apiClient';
import { AuthContext } from '../../../context/AuthContext.jsx';
import { isAdminLevel } from '../../../utils/permissions.js';

/**
 * Modal para EDITAR un usuario existente.
 * Actualizado para coincidir con la API de admin.
 */
function EditUser({ onClose, onUserUpdated, usuarioToEdit }) {
  const { user } = useContext(AuthContext);
  const isAdminLv0 = isAdminLevel(user, 0); // nivel 0 = súperadmin
  const canEditTipo = isAdminLv0; // sólo admin nivel 0 puede ver/editar Tipo
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
    if (isAdminLv0) {
      const telDigits = (telefono || '').trim();
      if (telDigits.length !== 10) {
        setIsLoading(false);
        setTelefonoError('El número debe tener exactamente 10 dígitos');
        globalThis.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: 'El teléfono debe tener 10 dígitos.' }}));
        return;
      }
      setTelefonoError(null);
    }

    // Validación de contraseña solo si el usuario escribió una nueva
    const pwd = (contrasena || '').trim();
    if (pwd !== '') {
      if (pwd.length < 8) {
        setIsLoading(false);
        setError('La contraseña debe tener al menos 8 caracteres');
        globalThis.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: 'La contraseña debe tener mínimo 8 caracteres.' }}));
        return;
      }
      // Solo letras y números (sin caracteres especiales)
      if (/[^A-Za-z0-9]/.test(pwd)) {
        setIsLoading(false);
        setError('La contraseña solo puede contener letras y números (sin símbolos)');
        globalThis.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: 'Usa solo letras y números; no se permiten símbolos.' }}));
        return;
      }
      // Mezcla obligatoria: al menos una letra y un número
      if (!(/[A-Za-z]/.test(pwd) && /\d/.test(pwd))) {
        setIsLoading(false);
        setError('La contraseña debe incluir letras y números');
        globalThis.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: 'La contraseña debe mezclar letras y números.' }}));
        return;
      }
    }

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
    if (pwd !== '') {
      userData.contrasena = pwd;
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
          {isAdminLv0 && (
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
          )}
          
          {/* Fila para Correo y Teléfono */}
          {isAdminLv0 && (
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
          )}

          {/* Fila para Matrícula y Tipo (permiso, visible solo para admin nivel 0) */}
          {isAdminLv0 && (
            <div className={`grid grid-cols-1 ${canEditTipo ? 'md:grid-cols-2' : ''} gap-4`}>
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
              {canEditTipo && (
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
              )}
            </div>
          )}

          {/* Contraseña Opcional */}
          <div className="pt-2 relative">
            <label htmlFor="edit_contrasena" className="block text-sm font-medium text-gray-700">Nueva Contraseña (Opcional)</label>
              <input 
                type={showPassword ? 'text' : 'password'} 
                id="edit_contrasena" 
                value={contrasena} 
                onChange={(e) => setContrasena(e.target.value.replace(/\s+/g, ''))} 
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                placeholder="Nueva Contraseña"
                minLength={8}
                pattern="[A-Za-z0-9]{8,}"
                title="Mínimo 8 caracteres, solo letras y números; sin espacios ni símbolos"
              />
              <button
                type="button"
                aria-pressed={showPassword}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm"
                style={{ position: 'absolute', right: '16px', top: '37%', color: '#6B7280' }}
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
              {/* Checklist dinámico de reglas */}
              <ul className="mt-2 text-xs space-y-1">
                {(() => {
                  const pwd = contrasena || '';
                  const hasMin = pwd.length >= 8;
                  const isAlnum = pwd === '' ? false : /^[A-Za-z0-9]+$/.test(pwd);
                  const hasMix = /[A-Za-z]/.test(pwd) && /\d/.test(pwd);
                  const Item = ({ ok, text }) => (
                    <li className={ok ? 'text-green-600' : 'text-gray-600'}>
                      <span className="inline-flex items-center gap-1">
                        {ok ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
                        )}
                        {text}
                      </span>
                    </li>
                  );
                  return (
                    <>
                      <Item ok={hasMin} text="Mínimo 8 caracteres" />
                      <Item ok={hasMix} text="Incluye al menos una letra y un número" />
                      <Item ok={isAlnum} text="Solo letras y números (sin espacios ni símbolos)" />
                    </>
                  );
                })()}
              </ul>
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
