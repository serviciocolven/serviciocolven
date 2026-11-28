import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { SelectorMes } from './Gastos'
import { dinero, mesActual, nombreMes, rangoMes } from './Utilidades'

const num = (x) => Number(x) || 0

export function Estadisticas({ productos }) {
  const [mes, setMes] = useState(mesActual())
  const [ventas, setVentas] = useState([])
  const [gastos, setGastos] = useState([])
  const [cierres, setCierres] = useState([])
  const [error, setError] = useState('')
  const [seguro, setSeguro] = useState(false)

  const cargar = useCallback(async () => {
    const [desde, hasta] = rangoMes(mes)
    const [v, g, c] = await Promise.all([
      supabase.from('ventas').select('*').gte('fecha', desde).lte('fecha', hasta),
      supabase.from('gastos').select('*').gte('fecha', desde).lte('fecha', hasta),
      supabase.from('cierres_mes').select('*').order('mes', { ascending: false }),
    ])
    const fallo = v.error || g.error || c.error
    if (fallo) {
      setError(fallo.message)
    } else {
      setError('')
      setVentas(v.data)
      setGastos(g.data)
      setCierres(c.data)
    }
  }, [mes])

  useEffect(() => {
    setSeguro(false)
    cargar()
  }, [cargar])

  const vendido = ventas.reduce((a, v) => a + num(v.cantidad) * num(v.precio), 0)
  const ganancia = ventas.reduce((a, v) => a + num(v.cantidad) * (num(v.precio) - num(v.costo)), 0)
  const unidades = ventas.reduce((a, v) => a + num(v.cantidad), 0)
  const gastado = gastos.reduce((a, g) => a + num(g.monto), 0)
  const limpio = ganancia - gastado
  const invertido = productos.reduce((a, p) => a + num(p.stock) * num(p.costo), 0)
  const siTodo = productos.reduce((a, p) => a + num(p.stock) * num(p.precio), 0)

  const porProd = {}
  ventas.forEach((v) => {
    const o = (porProd[v.descripcion] = porProd[v.descripcion] || {
      nombre: v.descripcion, cant: 0, total: 0, gan: 0,
    })
    o.cant += num(v.cantidad)
    o.total += num(v.cantidad) * num(v.precio)
    o.gan += num(v.cantidad) * (num(v.precio) - num(v.costo))
  })
  const top = Object.values(porProd).sort((a, b) => b.cant - a.cant)

  const catDe = {}
  productos.forEach((p) => {
    catDe[p.id] = p.categoria
  })
  const porCat = {}
  ventas.forEach((v) => {
    const c = catDe[v.producto_id] || 'Otros'
    porCat[c] = (porCat[c] || 0) + num(v.cantidad) * num(v.precio)
  })
  const cats = Object.entries(porCat).sort((a, b) => b[1] - a[1])
  const maxCat = Math.max(1, ...cats.map((c) => c[1]))

  const nDias = Number(rangoMes(mes)[1].slice(8))
  const dias = Array(nDias).fill(0)
  ventas.forEach((v) => {
    const i = Number(String(v.fecha).slice(8)) - 1
    if (i >= 0 && i < nDias) dias[i] += num(v.cantidad) * num(v.precio)
  })
  const maxDia = Math.max(1, ...dias)

  const cerrado = cierres.find((c) => c.mes === mes)

  async function cerrarMes() {
    if (!seguro) return setSeguro(true)
    const { error: fallo } = await supabase.from('cierres_mes').insert({
      mes,
      ventas: vendido,
      ganancia,
      gastos: gastado,
      unidades,
      mas_vendido: top[0] ? top[0].nombre : null,
      inversion: invertido,
    })
    setSeguro(false)
    if (fallo) setError(fallo.message)
    else cargar()
  }

  return (
    <>
      <h1>Estadísticas</h1>
      {error && <p className="error">{error}</p>}
      <div className="kpis kpis-2">
        <div className="kpi">
          <span>Dinero invertido en mercancía</span>
          <b>{dinero(invertido)}</b>
          <span>Si vendes todo: {dinero(siTodo)}</span>
        </div>
        <div className="kpi">
          <span>Te quedó limpio en {nombreMes(mes)}</span>
          <b className={limpio < 0 ? 'neg' : 'pos'}>{dinero(limpio)}</b>
          <span>Ganancia menos gastos</span>
        </div>
      </div>

      <h2>Mes</h2>
      <SelectorMes mes={mes} cambiar={setMes} />
      <div className="panel">
        <span className="etq">Ganancia de las ventas</span>
        <div className="grande-num pos">{dinero(ganancia)}</div>
        <div className="resumen">
          <span>Vendido <b>{dinero(vendido)}</b></span>
          <span>Gastos <b className="neg">−{dinero(gastado)}</b></span>
          <span><b>{unidades}</b> unidades</span>
          <span><b>{ventas.length}</b> ventas</span>
        </div>
        <div className="dias" aria-label="Ventas por día">
          {dias.map((v, i) => (
            <i key={i} className={v ? '' : 'cero'} style={{ height: (v / maxDia) * 100 + '%' }} title={dinero(v)} />
          ))}
        </div>
        <div className="extremos"><span>Día 1</span><span>Día {nDias}</span></div>
      </div>

      <h2>Lo que más salió en {nombreMes(mes)}</h2>
      <div className="lista">
        {top.length ? (
          top.slice(0, 5).map((t, i) => (
            <div className="item" key={t.nombre}>
              <div>
                <div className="item-titulo">{i + 1}. {t.nombre}</div>
                <div className="item-sub">{t.cant} unidades · ganancia {dinero(t.gan)}</div>
              </div>
              <div className="item-precio">{dinero(t.total)}</div>
            </div>
          ))
        ) : (
          <div className="vacio">Sin ventas este mes</div>
        )}
      </div>

      <h2>Ventas por categoría</h2>
      <div className="panel">
        {cats.length ? (
          <div className="barras">
            {cats.map(([c, v]) => (
              <div className="barra-fila" key={c}>
                <span>{c}</span>
                <i style={{ width: (v / maxCat) * 100 + '%' }} />
                <b>{dinero(v)}</b>
              </div>
            ))}
          </div>
        ) : (
          <span className="etq">Sin datos</span>
        )}
      </div>

      <h2>Cierre mensual</h2>
      <div className="panel">
        {cerrado ? (
          <>
            <b>✓ {nombreMes(mes)} ya está cerrado</b>
            <p className="etq">
              Cerrado el {String(cerrado.fecha)}: vendió {dinero(num(cerrado.ventas))}, ganó {dinero(num(cerrado.ganancia))},
              gastó {dinero(num(cerrado.gastos))}, quedó limpio {dinero(num(cerrado.ganancia) - num(cerrado.gastos))}
              y quedaron {dinero(num(cerrado.inversion))} en mercancía.
            </p>
          </>
        ) : (
          <>
            <p>
              Guarda cómo terminó {nombreMes(mes)}: ventas, ganancia, gastos, lo más vendido y el dinero que queda en mercancía.
            </p>
            <button className="b-rojo" style={{ width: '100%' }} onClick={cerrarMes}>
              {seguro ? '¿Confirmas el cierre? Toca otra vez' : 'Hacer cierre de ' + nombreMes(mes)}
            </button>
          </>
        )}
      </div>

      {cierres.length > 0 && (
        <>
          <h2>Cierres anteriores</h2>
          <div className="lista">
            {cierres.map((c) => {
              const limpioC = num(c.ganancia) - num(c.gastos)
              return (
                <div className="item" key={c.mes}>
                  <div>
                    <div className="item-titulo">{nombreMes(c.mes)}</div>
                    <div className="item-sub">
                      Vendió {dinero(num(c.ventas))} · Gastos {dinero(num(c.gastos))} · Más vendido: {c.mas_vendido || '—'}
                      <br />
                      Mercancía al cierre {dinero(num(c.inversion))}
                    </div>
                  </div>
                  <div className={'item-precio ' + (limpioC < 0 ? 'neg' : 'pos')}>
                    {dinero(limpioC)}
                    <div className="item-sub">limpio</div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </>
  )
        }
