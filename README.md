# Serviciocolven — Panel de gestión

App interna para gestionar plataformas de streaming, clientes, revendedores y finanzas.
Los datos se guardan en una base de datos real de Supabase, así que todo tu equipo verá
la misma información en tiempo real desde cualquier navegador.

## Cómo publicarla (sin usar la terminal)

1. Sube esta carpeta completa a un repositorio nuevo en GitHub (botón "Add file" → "Upload files").
2. Entra a https://netlify.com y crea una cuenta gratis.
3. "Add new site" → "Import an existing project" → conecta tu cuenta de GitHub → elige este repositorio.
4. Netlify detectará que es un proyecto Vite. Verifica que quede así:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Dale clic a "Deploy". En 1-2 minutos tendrás tu enlace propio (algo como `serviciocolven.netlify.app`).

Cualquier cambio que subas después al repositorio de GitHub se vuelve a publicar automáticamente.
