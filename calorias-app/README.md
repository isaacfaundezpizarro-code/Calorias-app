# CalorIA

App web simple para registrar comidas, guardar fotos y estimar calorias con IA.

## Como usar

1. Abre la app desde un servidor local (necesario para camara y acceso directo en iPhone):

```bash
./start.sh
```

2. En el Mac abre `http://localhost:8080`. En el iPhone (misma WiFi) abre `http://TU-IP-LOCAL:8080`.
3. Configura tu meta diaria en kcal (por defecto 2000).
4. Agrega alimentos manualmente o usa los botones de agregar rapido.
5. Opcional: toma una foto con la camara o elige una imagen de tu galeria.
6. Cambia la fecha para ver otros dias.
7. Los datos se guardan automaticamente en tu navegador (localStorage).

## Acceso directo en iPhone (PWA)

1. Abre la app en **Safari** (no en Chrome).
2. Toca el boton **Compartir** (cuadrado con flecha hacia arriba).
3. Elige **Anadir a pantalla de inicio**.
4. Confirma con **Anadir**.

Quedara un icono como app independiente, sin barra de Safari.

Para que funcione en el telefono, la app debe servirse por red local o internet (no abriendo el archivo suelto).

## Archivos

- `index.html` — estructura de la app
- `styles.css` — estilos
- `app.js` — logica y persistencia
- `manifest.webmanifest` — configuracion PWA
- `sw.js` — service worker (cache offline)
- `icons/` — iconos para pantalla de inicio
- `start.sh` — servidor local rapido

## Funciones

- Meta diaria configurable
- Registro por comida (desayuno, almuerzo, cena, snack)
- Resumen con calorias consumidas, restantes y progreso
- Desglose por tipo de comida
- Busqueda y filtros
- Editar y eliminar entradas
- Alimentos rapidos predefinidos
- Camara en vivo para fotografiar comida
- **Analisis de calorias con IA** a partir de la foto
- Galeria de fotos por entrada con vista ampliada

## Analisis con IA (fotos)

Al tomar o elegir una foto, la app usa **vision por IA** (Groq) para estimar:

- Nombre del plato
- Calorias aproximadas
- Porcion
- Tipo de comida (desayuno, almuerzo, etc.)

Revisa siempre el resultado y ajusta antes de guardar.

### Configurar la IA en Vercel

1. En [vercel.com](https://vercel.com), abre tu proyecto.
2. **Settings → Environment Variables**
3. Agrega `GROQ_API_KEY` con tu clave de [console.groq.com/keys](https://console.groq.com/keys).
4. Redespliega la app.

### Probar en local con IA

El servidor `./start.sh` no incluye la API. Para probar la IA en tu Mac:

```bash
cd calorias-app
npx vercel dev
```

Abre la URL que muestra (normalmente `http://localhost:3000`). Necesitas la variable `GROQ_API_KEY` en un archivo `.env.local` o en el entorno.

## Cuentas Google

La app incluye soporte para iniciar sesion con Google usando Firebase Authentication.
Cuando un usuario inicia sesion, sus comidas se guardan separadas por su ID de Google en este navegador.

### Activar Google Login

1. Entra a [Firebase Console](https://console.firebase.google.com/).
2. Crea un proyecto o usa uno existente.
3. Ve a **Authentication > Sign-in method**.
4. Activa **Google** como proveedor.
5. Ve a **Project settings > Your apps** y crea una app Web.
6. Copia la configuracion `firebaseConfig`.
7. Pega esos valores en `firebase-config.js`.
8. En **Authentication > Settings > Authorized domains**, agrega:
   - `calorias-app-murex.vercel.app`
   - tu dominio personalizado, si luego usas uno.

Despues haz commit, push y redeploy en Vercel.

## Camara

- **Abrir camara**: usa la camara trasera en movil (si esta disponible).
- **Elegir archivo**: sube una foto existente desde tu dispositivo.
- Las fotos se comprimen y se guardan junto a cada comida.
- Toca la miniatura en la lista para ver la foto en grande.

Nota: en algunos navegadores la camara solo funciona con HTTPS o en `localhost`. Si abres el archivo directamente (`file://`), usa "Elegir archivo".

## Publicar en Vercel (URL publica)

La carpeta ya esta lista para Vercel (`vercel.json` incluido). Al publicar tendras una URL como:

`https://calorias-app.vercel.app`

### Opcion A — Desde la web (recomendada)

1. Crea una cuenta en [vercel.com](https://vercel.com).
2. Sube el proyecto a GitHub (repositorio nuevo con la carpeta `calorias-app`).
3. En Vercel: **Add New → Project → Import** tu repositorio.
4. Configuracion del proyecto:
   - **Framework Preset:** Other
   - **Root Directory:** `calorias-app` (si el repo contiene mas carpetas) o deja vacio si solo esta esta app
   - **Build Command:** dejar vacio
   - **Output Directory:** dejar vacio o `.`
5. Pulsa **Deploy**.

En 1–2 minutos Vercel te dara la URL publica. Esa URL sirve para abrir la app en el iPhone y anadirla a la pantalla de inicio.

### Opcion B — Con terminal (Vercel CLI)

Necesitas Node.js instalado (`node` y `npx`).

```bash
cd calorias-app
npx vercel login
npx vercel
```

Sigue las preguntas (acepta los valores por defecto). La primera vez crea el proyecto; despues usa:

```bash
npx vercel --prod
```

para la version publica definitiva.

### Despues de publicar

- Abre la URL en **Safari** del iPhone.
- **Compartir → Anadir a pantalla de inicio**.
- La camara y la PWA funcionan porque Vercel usa **HTTPS** automaticamente.
