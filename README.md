#  LicorPro — Sistema de Gestión de Venta de Alcohol

Sistema completo de gestión para tiendas de venta de alcohol, desarrollado con **Angular 17 Standalone + Firebase Firestore**.

---

## Estructura del Proyecto

```
src/
├── app/
│   ├── components/
│   │   ├── dashboard/       # Dashboard con estadísticas y KPIs
│   │   ├── ventas/          # Registro y gestión de ventas
│   │   ├── pedidos/         # Control de pedidos a proveedores
│   │   ├── clientes/        # Base de clientes
│   │   ├── inventario/      # Catálogo de productos y stock
│   │   └── movimientos/     # Historial de movimientos de inventario
│   ├── services/
│   │   └── firebase.service.ts   # Todas las operaciones con Firestore
│   └── app.component.*           # Shell principal con sidebar
├── environments/
│   └── environment.ts            # ← AQUÍ van tus credenciales Firebase
└── styles.scss                   # Estilos globales (tema oscuro premium)
```

---

## Instalación Paso a Paso

### 1. Prerrequisitos
```bash
node -v   # Necesitas Node.js 18+
npm -v    # npm 9+
```

### 2. Instalar Angular CLI
```bash
npm install -g @angular/cli@17
```

### 3. Clonar / copiar el proyecto e instalar dependencias
```bash
cd alcohol-store
npm install
```

### 4. Configurar Firebase

#### A) Crear proyecto en Firebase Console
1. Ve a https://console.firebase.google.com
2. Clic en **"Agregar proyecto"**
3. Nombre: `licor-pro` (o el que prefieras)
4. Activa/desactiva Google Analytics según prefieras
5. Clic en **"Crear proyecto"**

#### B) Activar Firestore
1. En el menú lateral: **Build → Firestore Database**
2. Clic en **"Crear base de datos"**
3. Selecciona **"Comenzar en modo de prueba"** (para desarrollo)
4. Elige la región más cercana (ej: `us-central1`)

#### C) Obtener credenciales de la app web
1. En la consola Firebase, clic en el ícono → **Configuración del proyecto**
2. Scroll hacia abajo → **"Tus apps"** → Clic en **"</>"** (Web)
3. Registra la app con nombre `licor-pro`
4. Copia las credenciales del objeto `firebaseConfig`

#### D) Pegar credenciales en el proyecto
Abre `src/environments/environment.ts` y reemplaza los valores:

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: "AIzaSy...",              // ← tu apiKey
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto-id",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
  }
};
```

### 5. Ejecutar en desarrollo
```bash
ng serve
# Abre http://localhost:4200
```

### 6. Build para producción
```bash
ng build --configuration production
# Archivos en: dist/licor-pro/
```

---

## Colecciones en Firestore

El sistema crea automáticamente estas colecciones:

| Colección | Descripción |
|-----------|-------------|
| `clientes` | Datos de clientes (nombre, teléfono, email, RFC) |
| `productos` | Inventario (nombre, categoría, precios, stock) |
| `ventas` | Registro de ventas con items y totales |
| `pedidos` | Pedidos a proveedores |
| `movimientos` | Log automático de todos los cambios de inventario |

---

##  Funcionalidades

### Dashboard
- KPIs en tiempo real: ventas del día, clientes, pedidos pendientes, alertas de stock
- Top 5 productos más vendidos con barra visual
- Resumen financiero acumulado
- Últimas 8 ventas

### Ventas
- Registro de ventas con múltiples productos
- Selección de cliente, método de pago y descuentos
- Cálculo automático de subtotales y total
- Registro automático de movimientos de inventario al vender
- Filtros por estado y búsqueda por cliente
- Vista detalle de cada venta
- Cancelación de ventas

### Pedidos
- Creación de órdenes de compra a proveedores
- Flujo de estados: Pendiente → Enviado → Recibido
- Al marcar como "Recibido" actualiza stock automáticamente

### Clientes
- CRUD completo de clientes
- Campos: nombre, apellido, teléfono, email, dirección, RFC
- Búsqueda en tiempo real
- Desactivación suave (no elimina)

### Inventario
- Gestión de productos por categoría (cerveza, vino, destilado, licor, mixto)
- Precios de compra y venta independientes
- Control de stock mínimo con alertas visuales
- Resaltado de productos con stock bajo

### Movimientos
- Log automático de cada venta y recepción de pedido
- Filtros por tipo de movimiento y búsqueda por producto
- Contadores de entradas y salidas totales

---

## Seguridad (Producción)

Antes de publicar, actualiza `firestore.rules` para requerir autenticación:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

E implementa Firebase Authentication con:
```bash
npm install firebase
# Usar getAuth, signInWithEmailAndPassword de 'firebase/auth'
```

---

##  Tecnologías

- **Angular 17** (Standalone Components, sin módulos)
- **Firebase 10** (Firestore)
- **TypeScript 5.2**
- **SCSS** (tema oscuro premium con CSS variables)
- **Google Fonts**: Playfair Display + DM Sans
