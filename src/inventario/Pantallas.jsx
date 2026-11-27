import { useState } from 'react'
import { supabase } from './supabase'
import { dinero, hoy, CATEGORIAS, TOP } from './Utilidades'
import { FormProducto, FormVenta, FormStock } from './Formularios'

function masVendidoId(ventas) {
  const cuenta = {}
  ventas.forEach((v) => {
    if (v.producto_id) cuenta[v.producto_id] = (cuenta[v.producto_id] || 0) + v.cantidad
  })
  let mejor = null
  Object.entries(cuenta).forEach(([id, n]) => {
    if (!mejor || n > mejor[1]) mejor = [id, n]
  })
  return mejor ? mejor[0] : null
}

function Fila({ p, masVendido, acciones }) {
  const bajo = p.stock <= p.minimo
  return (
    <div className="item">
      <div>
        <div className="item-titulo">
          <button
            className={'estrella' + (p.favorito ? ' on' : '')}
            onClick={() => acciones.favorito(p)}
            aria-label="Favorito"
          >
            {p.favorito ? '★' : '☆'}
          </button>
          {p.nombre} {masVendido && <span className="etiqueta">Más vendido</span>}
        </div>
        <div className="item-sub">
          {p.categoria} · {p.modelo} · <span className={bajo ? 'bajo' : ''}>{p.stock} und</span>
        </div>
      </div>
      <div className="item-precio">{dinero(p.precio)}</div>
      <div className="item-acciones">
        <button className="b-rojo" disabled={p.stock < 1} onClick={() => acciones.vender(p)}>Vender</button>
        <button className="b-gris" onClick={() => acciones.stock(p)}>+ Stock</button>
        <button className="b-gris" onClick={() => acciones.editar(p)}>Editar</button>
      </div>
    </div>
  )
}

function useAcciones(productos, recargar) {
  const [modal, setModal] = useState(null)
  const cerrar = () => setModal(null)
  const listo = () => {
    setModal(null)
    recargar()
  }
  const acciones = {
    favorito: async (p) => {
      await supabase.from('productos').update({ favorito: !p.favorito }).eq('id', p.id)
      recargar()
    },
    vender: (p) => setModal(<FormVenta opciones={productos} inicial={p.id} cerrar={cerrar} listo={listo} />),
    venderCategoria: (c) =>
      setModal(<FormVenta opciones={productos.filter((p) => p.categoria === c)} cerrar={cerrar} listo={listo} />),
    stock: (p) => setModal(<FormStock producto={p} cerrar={cerrar} listo={listo} />),
    editar: (p) => setModal(<FormProducto producto={p} cerrar={cerrar} listo={listo} />),
    nuevo: () => setModal(<FormProducto cerrar={cerrar} listo={listo} />),
  }
  return [acciones, modal]
}

export function Inicio({ productos, ventas, recargar }) {
  const [acc, modal] = useAcciones(productos, recargar)
  const dia = hoy()
  const deHoy = ventas.filter((v) => v.fecha === dia)
  const totalHoy = deHoy.reduce((a, v) => a + v.cantidad * v.precio, 0)
  const ganHoy = deHoy.reduce((a, v) => a + v.cantidad * (v.precio - v.costo), 0)
  const bajos = productos.filter((p) => p.stock <= p.minimo)
  const topId = masVendidoId(ventas)
  const favoritos = productos.filter((p) => p.favorito || p.id === topId)
  const fila = (p) => <Fila key={p.id} p={p} masVendido={p.id === topId} acciones={acc} />

  return (
    <>
      <h1>Así va tu negocio hoy</h1>
      <div className="kpis">
        <div className="kpi"><span>Ventas hoy</span><b>{dinero(totalHoy)}</b></div>
        <div className="kpi"><span>Ganancia hoy</span><b>{dinero(ganHoy)}</b></div>
        <div className="kpi"><span>Stock bajo</span><b>{bajos.length}</b></div>
      </div>

      <h2>Lo más vendido</h2>
      <div className="top">
        {TOP.map((c) => {
          const ps = productos.filter((p) => p.categoria === c)
          const stock = ps.reduce((a, p) => a + p.stock, 0)
          const ids = new Set(ps.map((p) => p.id))
          const vend = ventas.filter((v) => ids.has(v.producto_id)).reduce((a, v) => a + v.cantidad, 0)
          return (
            <div className="tarjeta-top" key={c}>
              <b>{c}</b>
              <small>{stock} en stock · {vend} vendidos este mes</small>
              <button className="b-rojo" disabled={stock < 1} onClick={() => acc.venderCategoria(c)}>Vender</button>
            </div>
          )
        })}
      </div>

      <h2>★ Favoritos</h2>
      <div className="lista">
        {favoritos.length ? favoritos.map(fila) : <div className="vacio">Toca la ★ de un producto para tenerlo aquí</div>}
      </div>

      <h2>Se están acabando</h2>
      <div className="lista">
        {bajos.length ? bajos.map(fila) : <div className="vacio">Todo tiene stock suficiente</div>}
      </div>
      {modal}
    </>
  )
}

export function Inventario({ productos, ventas, recargar }) {
  const [acc, modal] = useAcciones(productos, recargar)
  const [cat, setCat] = useState('Todos')
  const [q, setQ] = useState('')
  const topId = masVendidoId(ventas)
  const lista = productos.filter(
    (p) =>
      (cat === 'Todos' || p.categoria === cat) &&
      (p.nombre + ' ' + p.modelo).toLowerCase().includes(q.toLowerCase())
  )
  const invertido = productos.reduce((a, p) => a + p.stock * p.costo, 0)

  return (
    <>
      <h1>Inventario</h1>
      <p className="sub">{productos.length} productos · dinero invertido {dinero(invertido)}</p>
      <input placeholder="Buscar producto o modelo…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="filtros">
        {['Todos', ...CATEGORIAS].map((c) => (
          <button key={c} className={'chip-btn' + (c === cat ? ' on' : '')} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>
      <div className="lista">
        {lista.length ? (
          lista.map((p) => <Fila key={p.id} p={p} masVendido={p.id === topId} acciones={acc} />)
        ) : (
          <div className="vacio">No hay productos aquí. Toca + para agregar.</div>
        )}
      </div>
      <button className="fab" onClick={acc.nuevo} aria-label="Agregar producto">+</button>
      {modal}
    </>
  )
}

export function Ventas({ ventas }) {
  const porDia = {}
  ventas.forEach((v) => {
    ;(porDia[v.fecha] = porDia[v.fecha] || []).push(v)
  })
  const dias = Object.keys(porDia).sort().reverse()

  return (
    <>
      <h1>Ventas del mes</h1>
      {dias.length ? (
        dias.map((d) => {
          const l = porDia[d]
          const tot = l.reduce((a, v) => a + v.cantidad * v.precio, 0)
          return (
            <section key={d}>
              <h2>{d === hoy() ? 'Hoy' : d} · {dinero(tot)}</h2>
              <div className="lista">
                {l.map((v) => (
                  <div className="item" key={v.id}>
                    <div>
                      <div className="item-titulo">{v.descripcion}</div>
                      <div className="item-sub">{v.cantidad} und · {v.pago}</div>
                    </div>
                    <div className="item-precio">{dinero(v.cantidad * v.precio)}</div>
                  </div>
                ))}
              </div>
            </section>
          )
        })
      ) : (
        <div className="vacio">Aún no hay ventas este mes</div>
      )}
    </>
  )
}
