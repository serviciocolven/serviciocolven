export const dinero = (n) =>
  (n < 0 ? '−' : '') + '$' + Math.abs(Math.round(n || 0)).toLocaleString('es-CO')

export const hoy = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })

export const inicioMes = () => hoy().slice(0, 8) + '01'

export const CATEGORIAS = [
  'Cargadores', 'Cables', 'Vidrios templados', 'Forros',
  'Audífonos', 'Celulares', 'Repuestos', 'Otros',
]

export const TOP = ['Cargadores', 'Cables', 'Vidrios templados']

export const PAGOS = ['Efectivo', 'Nequi', 'Daviplata', 'Transferencia', 'Tarjeta']
