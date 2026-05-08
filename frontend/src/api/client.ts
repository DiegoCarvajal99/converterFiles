import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Interceptor para manejo global de errores de red o servidor
client.interceptors.response.use(
  (response) => {
    // Si la respuesta exitosa (200) es en realidad una página HTML de Vercel (fallback)
    if (typeof response.data === 'string' && response.data.includes('<html')) {
      return Promise.reject(new Error('La API no está disponible (error de despliegue en el backend).'));
    }
    return response;
  },
  (error) => {
    // Si no hay respuesta del servidor (error de red/CORS)
    if (!error.response) {
      return Promise.reject(new Error('No se pudo conectar con el servidor. Verifica tu conexión o que el backend esté en ejecución.'));
    }
    
    // Si Vercel devuelve una página HTML de error
    if (typeof error.response.data === 'string' && error.response.data.includes('<html')) {
      return Promise.reject(new Error('El servidor devolvió un error interno o la API no está disponible.'));
    }
    
    // Errores 400 y 500
    const detail = error.response.data?.detail;
    const message = typeof detail === 'string' ? detail : 'Ocurrió un error inesperado en el servidor.';
    
    return Promise.reject(new Error(message));
  }
);

export default client;
