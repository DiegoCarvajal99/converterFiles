import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Interceptor para manejo global de errores de red o servidor
client.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si no hay respuesta del servidor (error de red/CORS)
    if (!error.response) {
      return Promise.reject(new Error('No se pudo conectar con el servidor. Verifica tu conexión o que el backend esté en ejecución.'));
    }
    
    // Errores 400 y 500
    const detail = error.response.data?.detail;
    const message = typeof detail === 'string' ? detail : 'Ocurrió un error inesperado en el servidor.';
    
    return Promise.reject(new Error(message));
  }
);

export default client;
