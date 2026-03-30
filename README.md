# Taketurn - SaaS de Gestión de Turnos

Taketurn es una plataforma multiempresa diseñada para simplificar la reserva y administración de turnos. Construida con React, Vite, TailwindCSS y Redux Toolkit, con una arquitectura desacoplada lista para integración directa con Firebase.

## 🚀 Tecnologías Principales

- **React + Vite**: Frontend de alto rendimiento.
- **TailwindCSS**: Diseño moderno, responsivo y vibrante.
- **React Router v7**: Enrutamiento dinámico para Landing, Admin y Portales Públicos.
- **Redux Toolkit**: Gestión de estado global (Auth, Negocio, Reservas).
- **Lucide React**: Set de íconos premium.
- **Firebase-Ready**: Estructura de servicios (`services/`) preparada para inyectar la SDK de Firebase/Firestore.

## 📁 Estructura del Proyecto

```text
src/
├── components/
│   ├── layout/      # LandingLayout, AdminLayout, PortalLayout
│   └── ui/          # Componentes reutilizables (Botones, Inputs)
├── features/        # Lógica de Redux (slices)
│   ├── auth/        # Sesión y usuarios
│   ├── business/    # Configuración de empresa
│   └── booking/     # Flujo de reserva del cliente
├── pages/           # Vistas principales
│   ├── admin/       # Panel de control de la empresa
│   ├── portal/      # Vista del cliente final (/:slug)
│   ├── landing/     # Página comercial principal
│   └── auth/        # Login y Registro
├── routes/          # Definición de rutas (createBrowserRouter)
├── services/        # Abstracción de datos (Mocked para integración Firebase)
└── store/           # Configuración del Store centralizado
```

## 🔐 Arquitectura Multiempresa (Multi-tenant)

El sistema utiliza **slugs dinámicos** en la URL para identificar a la empresa:
1. Al acceder a `taketurn.com/mi-negocio`, React Router captura `mi-negocio`.
2. El `PortalLayout` dispara una consulta al `dbService` para obtener el ID de la empresa vinculado a ese slug.
3. Se cargan los datos públicos, horarios y disponibilidad de esa empresa específica.

## 📅 Lógica de Disponibilidad

- Los horarios se definen en `business.settings.schedule`.
- El frontend genera los slots de tiempo basados en la duración configurada (ej. 30 min).
- Se cruzan los slots teóricos con los turnos ya existentes (`appointments`) para mostrar solo los huecos libres.

## 🛠 Instalación y Uso

1. Clonar el repositorio.
2. Ejecutar `npm install`.
3. Iniciar desarrollo: `npm run dev`.
4. Construir para producción: `npm run build`.

## 🔜 Próximos Pasos (Integraciones)

- **Firebase Auth**: Configurar `auth.service.js` con `firebase/auth`.
- **Firestore**: Configurar `db.service.js` con las colecciones descritas en el Plan de Implementación.
- **WhatsApp API**: Integrar en el flujo de confirmación de turnos.
- **Google Calendar**: Sincronización bidireccional de la agenda.
