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

export const GASTOS_CATS = [
  'Arriendo',
  'Servicios (luz, agua, internet)',
  'Compra de mercancía',
  'Repuestos para reparaciones',
  'Transporte',
  'Nómina / pagos',
  'Publicidad',
  'Otros',
]

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

export const mesActual = () => hoy().slice(0, 7)

export const nombreMes = (m) => MESES[Number(m.slice(5, 7)) - 1] + ' ' + m.slice(0, 4)

export const ultimosMeses = (cuantos = 12) => {
  const lista = []
  let anio = Number(hoy().slice(0, 4))
  let mes = Number(hoy().slice(5, 7))
  for (let i = 0; i < cuantos; i++) {
    lista.push(anio + '-' + String(mes).padStart(2, '0'))
    mes -= 1
    if (mes === 0) {
      mes = 12
      anio -= 1
    }
  }
  return lista
}

export const rangoMes = (m) => {
  const [a, mm] = m.split('-').map(Number)
  const dias = new Date(a, mm, 0).getDate()
  return [m + '-01', m + '-' + String(dias).padStart(2, '0')]
}
