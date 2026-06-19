import api from './client'

// Auth
export const login = (email, password) => api.post('/auth/login', { email, password })
export const register = (data) => api.post('/auth/register', data)

// Consultas
export const getEventos = () => api.get('/consulta/eventos')
export const getCatalogos = () => api.get('/consulta/catalogos')
export const getSectoresEstadio = (id) => api.get(`/consulta/estadios/${id}/sectores`)
export const getFuncionarios = () => api.get('/consulta/funcionarios')

// Compras
export const comprar = (eventoSectores) => api.post('/compras', { eventoSectores })
export const pagar = (id) => api.post(`/compras/${id}/pagar`)
export const getMisCompras = (userId) => api.get(`/usuarios/${userId}/compras`)

// Entradas
export const getMisEntradas = (userId) => api.get(`/usuarios/${userId}/entradas`)
export const getToken = (id) => api.post(`/entradas/${id}/token`)

// Transferencias
export const getMisTransferencias = (userId) => api.get(`/usuarios/${userId}/transferencias`)
export const transferir = (idEntrada, idDestino) =>
  api.post('/transferencias', { idEntrada, idDestino })
export const aceptarTransferencia = (id) => api.post(`/transferencias/${id}/aceptar`)
export const rechazarTransferencia = (id) => api.post(`/transferencias/${id}/rechazar`)

// Admin
export const crearEstadio = (data) => api.post('/estadios', data)
export const agregarSector = (id, data) => api.post(`/estadios/${id}/sectores`, data)
export const crearEvento = (data) => api.post('/eventos', data)
export const habilitarSector = (id, data) => api.post(`/eventos/${id}/sectores`, data)
export const cancelarEvento = (id) => api.post(`/eventos/${id}/cancelar`)

// Dispositivos
export const getDispositivos = () => api.get('/dispositivos')
export const registrarDispositivo = (data) => api.post('/dispositivos', data)

// Asignaciones
export const getAsignaciones = (idEvento) => api.get(`/asignaciones/evento/${idEvento}`)
export const asignar = (data) => api.post('/asignaciones', data)

// Validación
export const validar = (data) => api.post('/validaciones', data)

// Reportes
export const getRankingCompradores = () => api.get('/reportes/ranking-compradores')
export const getEventosTop = () => api.get('/reportes/eventos-top')
export const getEstadisticas = () => api.get('/reportes/estadisticas-estadio')
