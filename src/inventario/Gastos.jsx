import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { Modal } from './Formularios'
import {
  dinero, hoy, GASTOS_CATS, PAGOS,
  mesActual, ultimosMeses, nombreMes, rangoMes,
} from './Utilidades'

export function SelectorMes({ mes, cambiar }) {
  return (
    <div className="filtros">
      {ultimosMeses(12).map((m) => (
        <button key={m} className={'chip-btn' + (m === mes ? ' on' : '')} onClick={() => cambiar(m)}>
          {nombreMes(m)}
        </button>
      ))}
    </div>
  )
}

function FormGasto({ cerrar, listo }) {
  const [concepto, setConcepto] = useState('')
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(hoy())
  const [categoria, setCategoria] = useState(GASTOS_CATS[0])
  const [pago, setPago] = useState('Efectivo')
  const [msg, setMsg] = useState('')
  const [ocupado, setOcupado] = useState(false)

  async function guardar() {
    const m = Number(monto)
    if (!concepto.trim() || !(m > 0)) return setMsg('Escribe el concepto y el monto')
    setOcupado(true)
    const { error } = await supabase.from('gastos').insert({
      concepto: concepto.trim(),
      monto: m,
      fecha: fecha || hoy(),
      categoria,
      pago,
    })
    setOcupado(false)
    if (error) return setMsg('No se pudo guardar: ' + error.message)
    listo()
  }

  return (
    <Modal titulo="Registrar gasto" cerrar={cerrar}>
      <label>¿En qué se gastó?</label>
      <input
        value={concepto}
        onChange={(e) => setConcepto(e.target.value)}
        placeholder="Ej: pago de luz, almuerzo, domicilio"
      />
      <div className="dos">
        <div>
          <label>Monto</label>
          <input type="number" inputMode="numeric" value={monto} onChange={(e) => setMonto(e.target.value)} />
        </div>
        <div>
          <label>Fecha</label>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
      </div>
      <label>Tipo de gasto</label>
      <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
        {GASTOS_CATS.map((c) => <option key={c}>{c}</option>)}
      </select>
      <label>Pagado con</label>
      <select value={pago} onChange={(e) => setPago(e.target.value)}>
        {PAGOS.map((p) => <option key={p}>{p}</option>)}
      </select>
      <div className="fila-fin">
        <button className="b-rojo" onClick={guardar} disabled={ocupado}>Guardar gasto</button>
        <button className="b-gris" onClick={cerrar}>Cancelar</button>
      </div>
      {msg && <p className="error">{msg}</p>}
    </Modal>
  )
}

export function Gastos() {
  const [mes, setMes] = useState(mesActual())
  const [gastos, setGastos] = useState([])
  const [error, setError] = useState('')
  const [modal, setModal] = useState(false)
  const [seguro, setSeguro] = useState(null)

  const cargar = useCallback(async () => {
    const [desde, hasta] = rangoMes(mes)
    const { data, error } = await supabase
      .from('gastos')
      .select('*')
      .gte('fecha', desde)
      .lte('fecha', hasta)
      .order('fecha', { ascending: false })
    if (error) {
      setError(error.message)
    } else {
      setError('')
      setGastos(data)
    }
  }, [mes])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function borrar(g) {
    if (seguro !== g.id) return setSeguro(g.id)
    const { error } = await supabase.from('gastos').delete().eq('id', g.id)
    setSeguro(null)
    if (error) setError(error.message)
    else cargar()
  }

  const total = gastos.reduce((a, g) => a + Number(g.monto), 0)
  const porCat = {}
  gastos.forEach((g) => {
    porCat[g.categoria] = (porCat[g.categoria] || 0) + Number(g.monto)
  })
  const cats = Object.entries(porCat).sort((a, b) => b[1] - a[1])
  const maxCat = Math.max(1, ...cats.map((c) => c[1]))

  return (
    <>
      <h1>Gastos</h1>
      <SelectorMes mes={mes} cambiar={setMes} />
      {error && <p className="error">{error}</p>}
      <div className="panel">
        <span className="etq">Gastado en {nombreMes(mes)}</span>
        <div className="grande-num neg">{dinero(total)}</div>
        <div className="barras">
          {cats.map(([c, v]) => (
            <div className="barra-fila" key={c}>
              <span>{c}</span>
              <i style={{ width: (v / maxCat) * 100 + '%' }} />
              <b>{dinero(v)}</b>
            </div>
          ))}
        </div>
      </div>
      <h2>Detalle</h2>
      <div className="lista">
        {gastos.length ? (
          gastos.map((g) => (
            <div className="item" key={g.id}>
              <div>
                <div className="item-titulo">{g.concepto}</div>
                <div className="item-sub">{g.categoria} · {g.fecha} · {g.pago}</div>
              </div>
              <div className="item-precio neg">−{dinero(g.monto)}</div>
              <div className="item-acciones">
                <button className="b-gris" onClick={() => borrar(g)}>
                  {seguro === g.id ? '¿Seguro? Toca otra vez' : 'Eliminar'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="vacio">Sin gastos este mes. Toca + para registrar uno.</div>
        )}
      </div>
      <button className="fab" onClick={() => setModal(true)} aria-label="Registrar gasto">+</button>
      {modal && (
        <FormGasto
          cerrar={() => setModal(false)}
          listo={() => {
            setModal(false)
            cargar()
          }}
        />
      )}
    </>
  )
}
