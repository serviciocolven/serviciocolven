import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { Inicio, Inventario, Ventas } from './Pantallas'
import { inicioMes } from './Utilidades'
import './Estilos.css'

function Marca({ grande }) {
  return (
    <div className={'marca' + (grande ? ' grande' : '')}>
      <span>SERVICIO</span><span>COLVEN</span>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(undefined)
  const [recuperando, setRecuperando] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((evento, s) => {
      setSession(s)
      if (evento === 'PASSWORD_RECOVERY') setRecuperando(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  if (session === undefined) return <p style={{ padding: 24 }}>Cargando…</p>
  if (recuperando) return <NuevaClave onListo={() => setRecuperando(false)} />
  if (!session) return <Login />
  return <Panel />
}

function Login() {
  const [modo, setModo] = useState('entrar')
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [msg, setMsg] = useState('')

  async function entrar(e) {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email: correo, password: clave })
    if (error) setMsg('Correo o clave incorrectos')
  }

  async function enviarCorreo(e) {
    e.preventDefault()
    const { error } = await supabase.auth.resetPasswordForEmail(correo, {
      redirectTo: window.location.origin + '/inventario/',
    })
    setMsg(error ? 'No se pudo enviar el correo' : 'Te enviamos un enlace al correo para crear una nueva clave')
  }

  return (
    <div className="entrada">
      <Marca grande />
      <form className="caja-login" onSubmit={modo === 'entrar' ? entrar : enviarCorreo}>
        <h1>{modo === 'entrar' ? 'Entra a tu negocio' : 'Restablecer clave'}</h1>
        <input type="email" placeholder="Correo" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
        {modo === 'entrar' && (
          <input type="password" placeholder="Clave" value={clave} onChange={(e) => setClave(e.target.value)} required />
        )}
        <button className="b-rojo" type="submit">{modo === 'entrar' ? 'Entrar' : 'Enviar enlace'}</button>
        <button
          className="b-link"
          type="button"
          onClick={() => {
            setModo(modo === 'entrar' ? 'olvide' : 'entrar')
            setMsg('')
          }}
        >
          {modo === 'entrar' ? '¿Olvidaste tu clave?' : '← Volver'}
        </button>
        {msg && <p className={msg.startsWith('Te enviamos') ? '' : 'error'}>{msg}</p>}
      </form>
    </div>
  )
}

function NuevaClave({ onListo }) {
  const [clave, setClave] = useState('')
  const [msg, setMsg] = useState('')

  async function guardar(e) {
    e.preventDefault()
    if (clave.length < 6) return setMsg('Mínimo 6 caracteres')
    const { error } = await supabase.auth.updateUser({ password: clave })
    if (error) setMsg('No se pudo cambiar la clave')
    else onListo()
  }

  return (
    <div className="entrada">
      <Marca grande />
      <form className="caja-login" onSubmit={guardar}>
        <h1>Crea tu nueva clave</h1>
        <input type="password" placeholder="Nueva clave" value={clave} onChange={(e) => setClave(e.target.value)} required />
        <button className="b-rojo" type="submit">Guardar clave</button>
        {msg && <p className="error">{msg}</p>}
      </form>
    </div>
  )
}

const MENU = [
  ['inicio', 'Inicio', 'M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z'],
  ['inv', 'Inventario', 'M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7'],
  ['ven', 'Ventas', 'M4 4h16v16H4zM8 9h8M8 13h8M8 17h5'],
]

function Panel() {
  const [vista, setVista] = useState('inicio')
  const [productos, setProductos] = useState([])
  const [ventas, setVentas] = useState([])
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async () => {
    const [p, v] = await Promise.all([
      supabase.from('productos').select('*').order('nombre'),
      supabase.from('ventas').select('*').gte('fecha', inicioMes()).order('creado', { ascending: false }),
    ])
    const fallo = p.error || v.error
    if (fallo) {
      setError(fallo.message)
    } else {
      setError('')
      setProductos(p.data)
      setVentas(v.data)
    }
    setCargando(false)
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  return (
    <div>
      <header className="barra">
        <Marca />
        <div className="barra-der">
          <a className="link-blanco" href="/">Ir a Streaming</a>
          <button className="b-link" onClick={() => supabase.auth.signOut()}>Salir</button>
        </div>
      </header>
      <nav className="menu">
        {MENU.map(([id, nombre, d]) => (
          <button
            key={id}
            className={vista === id ? 'act' : ''}
            onClick={() => {
              setVista(id)
              window.scrollTo(0, 0)
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={d} />
            </svg>
            <span>{nombre}</span>
          </button>
        ))}
      </nav>
      <main className="contenido">
        {error && <p className="error">No se pudieron cargar los datos: {error}</p>}
        {cargando ? (
          <p>Cargando…</p>
        ) : vista === 'inicio' ? (
          <Inicio productos={productos} ventas={ventas} recargar={cargar} />
        ) : vista === 'inv' ? (
          <Inventario productos={productos} ventas={ventas} recargar={cargar} />
        ) : (
          <Ventas ventas={ventas} />
        )}
      </main>
    </div>
  )
                                                                                           }
