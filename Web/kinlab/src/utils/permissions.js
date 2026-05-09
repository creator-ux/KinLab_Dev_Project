// Utilidades de permisos para el frontend (extensible por niveles)
// Centraliza las reglas de visibilidad/acciones para distintos roles.

export function isAdmin(user) {
  const tipo = String(user?.tipo || '').toLowerCase();
  return tipo === 'administrador';
}

export function isAdminLevel(user, level) {
  // Coerce nivel to number to handle values like "1" coming from API/localStorage
  const nivel = Number(user?.nivel);
  return isAdmin(user) && nivel === Number(level);
}

// Áreas: sólo visible para administrador de nivel 0
export function canAccessAreas(user) {
  return isAdminLevel(user, 0);
}

//Historial: Apartado tipo auditoría visible sólo para administrador de nivel 0
export function canAccessHistory(user) {
  return isAdminLevel (user, 0);
}

// Crear usuarios: sólo administrador de nivel 0
export function canCreateUser(user) {
  return isAdminLevel(user, 0);
}

// Placeholder para futuras reglas por laboratorio
// export function getLabScope(user) { /* en futuro: devolver id_laboratorio asignado */ }
