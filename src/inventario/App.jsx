import { useEffect, useState } from 'react'
import { supabase } from './supabase'

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
  return <Panel email={session.user.email} />
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
    <form onSubmit={modo === 'entrar' ? entrar : enviarCorreo}
      style={{ maxWidth: 360, margin: '12vh auto', padding: 24, display: 'grid', gap: 10 }}>
      <h2>{modo === 'entrar' ? 'Entra a tu negocio' : 'Restablecer clave'}</h2>
      <input type="email" placeholder="Correo" value={correo} onChange={e => setCorreo(e.target.value)} required />
      {modo === 'entrar' && (
        <input type="password" placeholder="Clave" value={clave} onChange={e => setClave(e.target.value)} required />
      )}
      <button type="submit">{modo === 'entrar' ? 'Entrar' : 'Enviar enlace'}</button>
      <button type="button" onClick={() => { setModo(modo === 'entrar' ? 'olvide' : 'entrar'); setMsg('') }}>
        {modo === 'entrar' ? '¿Olvidaste tu clave?' : '← Volver'}
      </button>
      <p>{msg}</p>
    </form>
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
    <form onSubmit={guardar} style={{ maxWidth: 360, margin: '12vh auto', padding: 24, display: 'grid', gap: 10 }}>
      <h2>Crea tu nueva clave</h2>
      <input type="password" placeholder="Nueva clave" value={clave} onChange={e => setClave(e.target.value)} required />
      <button type="submit">Guardar clave</button>
      <p>{msg}</p>
    </form>
  )
}

function Panel({ email }) {
  const [n, setN] = useState(null)

  useEffect(() => {
    supabase.from('productos').select('*', { count: 'exact', head: true })
      .then(({ count }) => setN(count))
  }, [])

  return (
    <div style={{ padding: 24 }}>
      <h1>Inventario Serviciocolven</h1>
      <p>Sesión: {email}</p>
      <p>Productos en la base de datos: {n ?? '…'}</p>
      <p><a href="/">Ir a Streaming</a></p>
      <button onClick={() => supabase.auth.signOut()}>Salir</button>
    </div>
  )
        }
