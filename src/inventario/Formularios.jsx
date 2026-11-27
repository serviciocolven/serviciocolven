import { useState } from 'react'
import { supabase } from './supabase'
import { CATEGORIAS, PAGOS } from './Utilidades'

export function Modal({ titulo, cerrar, children }) {
  return (
    <div className="fondo-modal" onClick={(e) => e.target === e.currentTarget && cerrar()}>
      <div className="hoja">
        <h2>{titulo}</h2>
        {children}
      </div>
    </div>
  )
}

export function FormProducto({ producto, cerrar, listo }) {
  const [f, setF] = useState(
    producto || { nombre: '', categoria: 'Cargadores', modelo: '', costo: '', precio: '', stock: '', minimo: 3 }
  )
  const [msg, setMsg] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [seguro, setSeguro] = useState(false)
  const poner = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function guardar() {
    const d = {
      nombre: String(f.nombre).trim(),
      categoria: f.categoria,
      modelo: String(f.modelo).trim() || 'Universal',
      costo: Number(f.costo) || 0,
      precio: Number(f.precio) || 0,
      stock: Math.max(0, parseInt(f.stock, 10) || 0),
      minimo: Math.max(0, parseInt(f.minimo, 10) || 0),
    }
    if (!d.nombre || d.precio <= 0) return setMsg('Falta el nombre o el precio')
    setOcupado(true)
    const { error } = producto
      ? await supabase.from('productos').update(d).eq('id', producto.id)
      : await supabase.from('productos').insert(d)
    setOcupado(false)
    if (error) return setMsg('No se pudo guardar: ' + error.message)
    listo()
  }

  async function eliminar() {
    if (!seguro) return setSeguro(true)
    const { error } = await supabase.from('productos').delete().eq('id', producto.id)
    if (error) return setMsg('No se pudo eliminar: ' + error.message)
    listo()
  }

  return (
    <Modal titulo={producto ? 'Editar producto' : 'Agregar producto'} cerrar={cerrar}>
      <label>Nombre</label>
      <input value={f.nombre} onChange={poner('nombre')} placeholder="Ej: Cargador tipo C 25W" />
      <div className="dos">
        <div>
          <label>Categoría</label>
          <select value={f.categoria} onChange={poner('categoria')}>
            {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label>Modelo / compatible</label>
          <input value={f.modelo} onChange={poner('modelo')} placeholder="Ej: iPhone 13" />
        </div>
        <div>
          <label>Costo</label>
          <input type="number" inputMode="numeric" value={f.costo} onChange={poner('costo')} />
        </div>
        <div>
          <label>Precio de venta</label>
          <input type="number" inputMode="numeric" value={f.precio} onChange={poner('precio')} />
        </div>
        <div>
          <label>Cantidad</label>
          <input type="number" inputMode="numeric" value={f.stock} onChange={poner('stock')} />
        </div>
        <div>
          <label>Avisar cuando queden</label>
          <input type="number" inputMode="numeric" value={f.minimo} onChange={poner('minimo')} />
        </div>
      </div>
      <div className="fila-fin">
        <button className="b-rojo" onClick={guardar} disabled={ocupado}>Guardar</button>
        {producto && (
          <button className="b-gris" onClick={eliminar}>{seguro ? '¿Seguro? Toca otra vez' : 'Eliminar'}</button>
        )}
        <button className="b-gris" onClick={cerrar}>Cancelar</button>
      </div>
      {msg && <p className="error">{msg}</p>}
    </Modal>
  )
}

export function FormVenta({ opciones, inicial, cerrar, listo }) {
  const disponibles = opciones.filter((p) => p.stock > 0)
  const primero = disponibles.find((p) => p.id === inicial) || disponibles[0]
  const [id, setId] = useState(primero ? primero.id : '')
  const [cant, setCant] = useState(1)
  const [precio, setPrecio] = useState(primero ? primero.precio : '')
  const [pago, setPago] = useState('Efectivo')
  const [msg, setMsg] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const prod = disponibles.find((p) => p.id === id)

  if (!disponibles.length) {
    return (
      <Modal titulo="Registrar venta" cerrar={cerrar}>
        <p>No hay productos con stock para vender.</p>
        <button className="b-gris" onClick={cerrar}>Cerrar</button>
      </Modal>
    )
  }

  function elegir(e) {
    const p = disponibles.find((x) => x.id === e.target.value)
    if (p) {
      setId(p.id)
      setPrecio(p.precio)
    }
  }

  async function vender() {
    const q = parseInt(cant, 10)
    if (!prod || !(q >= 1)) return setMsg('Escribe una cantidad válida')
    if (q > prod.stock) return setMsg('Solo hay ' + prod.stock + ' unidades')
    setOcupado(true)
    const { data, error } = await supabase
      .from('productos')
      .update({ stock: prod.stock - q })
      .eq('id', prod.id)
      .eq('stock', prod.stock)
      .select()
    if (error || !data || data.length === 0) {
      setOcupado(false)
      return setMsg('El stock cambió. Cierra y vuelve a intentar.')
    }
    const { error: e2 } = await supabase.from('ventas').insert({
      producto_id: prod.id,
      descripcion: prod.nombre + ' · ' + prod.modelo,
      cantidad: q,
      precio: Number(precio) || prod.precio,
      costo: prod.costo,
      pago,
    })
    if (e2) {
      await supabase.from('productos').update({ stock: prod.stock }).eq('id', prod.id)
      setOcupado(false)
      return setMsg('No se pudo registrar la venta: ' + e2.message)
    }
    setOcupado(false)
    listo()
  }

  return (
    <Modal titulo="Registrar venta" cerrar={cerrar}>
      <label>Producto</label>
      <select value={id} onChange={elegir}>
        {disponibles.map((p) => (
          <option key={p.id} value={p.id}>{p.nombre} · {p.modelo} ({p.stock})</option>
        ))}
      </select>
      <div className="dos">
        <div>
          <label>Cantidad</label>
          <input type="number" inputMode="numeric" min="1" value={cant} onChange={(e) => setCant(e.target.value)} />
        </div>
        <div>
          <label>Precio c/u</label>
          <input type="number" inputMode="numeric" value={precio} onChange={(e) => setPrecio(e.target.value)} />
        </div>
      </div>
      <label>Pago</label>
      <select value={pago} onChange={(e) => setPago(e.target.value)}>
        {PAGOS.map((p) => <option key={p}>{p}</option>)}
      </select>
      <div className="fila-fin">
        <button className="b-rojo" onClick={vender} disabled={ocupado}>Vendido ✓</button>
        <button className="b-gris" onClick={cerrar}>Cancelar</button>
      </div>
      {msg && <p className="error">{msg}</p>}
    </Modal>
  )
}

export function FormStock({ producto, cerrar, listo }) {
  const [n, setN] = useState(10)
  const [msg, setMsg] = useState('')

  async function sumar() {
    const q = parseInt(n, 10)
    if (!(q >= 1)) return setMsg('Escribe cuántas llegaron')
    const { data, error } = await supabase
      .from('productos')
      .update({ stock: producto.stock + q })
      .eq('id', producto.id)
      .eq('stock', producto.stock)
      .select()
    if (error || !data || data.length === 0) return setMsg('El stock cambió. Cierra y vuelve a intentar.')
    listo()
  }

  return (
    <Modal titulo="Entrada de mercancía" cerrar={cerrar}>
      <p>{producto.nombre} · {producto.modelo}. Hay {producto.stock}.</p>
      <label>¿Cuántas llegaron?</label>
      <input type="number" inputMode="numeric" value={n} onChange={(e) => setN(e.target.value)} />
      <div className="fila-fin">
        <button className="b-rojo" onClick={sumar}>Sumar</button>
        <button className="b-gris" onClick={cerrar}>Cancelar</button>
      </div>
      {msg && <p className="error">{msg}</p>}
    </Modal>
  )
}
