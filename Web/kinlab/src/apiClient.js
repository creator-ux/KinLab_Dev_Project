// Cliente API central basado en fetch
// - Añade automáticamente Authorization: Bearer <token> si existe en localStorage
// - Usa base URL desde VITE_API_BASE o http://localhost:3000

const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE) || 'http://localhost:3000';

async function request(path, { method = 'GET', headers = {}, body, isFormData = false } = {}) {
  const token = localStorage.getItem('token');

  const finalHeaders = { ...headers };
  if (!isFormData && body !== undefined && finalHeaders['Content-Type'] === undefined) {
    finalHeaders['Content-Type'] = 'application/json';
  }
  if (token) {
    finalHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: isFormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
  });

  // Intentar parsear JSON, pero permitir respuestas vacías
  let data;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message = (data && (data.error || data.message)) || `Error ${response.status}`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  baseUrl: BASE_URL,
  request,
  get: (path, headers) => request(path, { method: 'GET', headers }),
  post: (path, body, headers) => request(path, { method: 'POST', headers, body }),
  put: (path, body, headers) => request(path, { method: 'PUT', headers, body }),
  del: (path, headers) => request(path, { method: 'DELETE', headers }),
  upload: (path, formData, headers) => request(path, { method: 'POST', headers, body: formData, isFormData: true }),
};

export default api;