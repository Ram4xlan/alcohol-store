import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, query, orderBy, where, Timestamp, onSnapshot
} from 'firebase/firestore';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface Cliente {
  id?: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  direccion: string;
  rfc?: string;
  fechaRegistro: Timestamp | Date;
  activo: boolean;
}

export interface Producto {
  id?: string;
  nombre: string;
  categoria: 'cerveza' | 'vino' | 'destilado' | 'licor' | 'mixto';
  marca: string;
  presentacion: string;
  precioCompra: number;
  precioVenta: number;
  stock: number;
  stockMinimo: number;
  proveedor: string;
  activo: boolean;
}

export interface Venta {
  id?: string;
  clienteId: string;
  clienteNombre: string;
  productos: ItemVenta[];
  subtotal: number;
  descuento: number;
  total: number;
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia';
  estado: 'completada' | 'cancelada' | 'pendiente';
  fecha: Timestamp | Date;
  notas?: string;
}

export interface ItemVenta {
  productoId: string;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Pedido {
  id?: string;
  proveedor: string;
  productos: ItemPedido[];
  total: number;
  estado: 'pendiente' | 'enviado' | 'recibido' | 'cancelado';
  fechaPedido: Timestamp | Date;
  fechaEntrega?: Timestamp | Date;
  notas?: string;
}

export interface ItemPedido {
  productoId: string;
  productoNombre: string;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
}

export interface Movimiento {
  id?: string;
  tipo: 'venta' | 'compra' | 'ajuste' | 'devolucion';
  productoId: string;
  productoNombre: string;
  cantidad: number;
  referencia: string;
  fecha: Timestamp | Date;
  usuario: string;
  notas?: string;
}

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  private app = initializeApp(environment.firebase);
  private db = getFirestore(this.app);

  // ── CLIENTES ──────────────────────────────────────────────────────────────
  async addCliente(cliente: Cliente): Promise<string> {
    cliente.fechaRegistro = Timestamp.now();
    const ref = await addDoc(collection(this.db, 'clientes'), cliente);
    return ref.id;
  }

  async getClientes(): Promise<Cliente[]> {
    const q = query(collection(this.db, 'clientes'), orderBy('nombre'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Cliente));
  }

  async updateCliente(id: string, data: Partial<Cliente>): Promise<void> {
    await updateDoc(doc(this.db, 'clientes', id), data);
  }

  async deleteCliente(id: string): Promise<void> {
    await updateDoc(doc(this.db, 'clientes', id), { activo: false });
  }

  // ── PRODUCTOS ────────────────────────────────────────────────────────────
  async addProducto(producto: Producto): Promise<string> {
    const ref = await addDoc(collection(this.db, 'productos'), producto);
    return ref.id;
  }

  async getProductos(): Promise<Producto[]> {
    const q = query(collection(this.db, 'productos'), where('activo', '==', true));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Producto));
  }

  async updateProducto(id: string, data: Partial<Producto>): Promise<void> {
    await updateDoc(doc(this.db, 'productos', id), data);
  }

  async updateStock(productoId: string, cantidad: number): Promise<void> {
    const ref = doc(this.db, 'productos', productoId);
    const snap = await getDocs(query(collection(this.db, 'productos'), where('__name__', '==', productoId)));
    if (!snap.empty) {
      const actual = (snap.docs[0].data() as Producto).stock;
      await updateDoc(ref, { stock: actual + cantidad });
    }
  }

  // ── VENTAS ───────────────────────────────────────────────────────────────
  async addVenta(venta: Venta): Promise<string> {
    venta.fecha = Timestamp.now();
    const ref = await addDoc(collection(this.db, 'ventas'), venta);
    // Descontar stock y registrar movimientos
    for (const item of venta.productos) {
      await this.registrarMovimiento({
        tipo: 'venta',
        productoId: item.productoId,
        productoNombre: item.productoNombre,
        cantidad: -item.cantidad,
        referencia: ref.id,
        fecha: Timestamp.now(),
        usuario: 'sistema'
      });
    }
    return ref.id;
  }

  async getVentas(): Promise<Venta[]> {
    const q = query(collection(this.db, 'ventas'), orderBy('fecha', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Venta));
  }

  async updateVenta(id: string, data: Partial<Venta>): Promise<void> {
    await updateDoc(doc(this.db, 'ventas', id), data);
  }

  // ── PEDIDOS ──────────────────────────────────────────────────────────────
  async addPedido(pedido: Pedido): Promise<string> {
    pedido.fechaPedido = Timestamp.now();
    const ref = await addDoc(collection(this.db, 'pedidos'), pedido);
    return ref.id;
  }

  async getPedidos(): Promise<Pedido[]> {
    const q = query(collection(this.db, 'pedidos'), orderBy('fechaPedido', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Pedido));
  }

  async updatePedido(id: string, data: Partial<Pedido>): Promise<void> {
    await updateDoc(doc(this.db, 'pedidos', id), data);
    if (data.estado === 'recibido') {
      const snap = await getDocs(query(collection(this.db, 'pedidos'), where('__name__', '==', id)));
      if (!snap.empty) {
        const pedido = snap.docs[0].data() as Pedido;
        for (const item of pedido.productos) {
          await this.registrarMovimiento({
            tipo: 'compra',
            productoId: item.productoId,
            productoNombre: item.productoNombre,
            cantidad: item.cantidad,
            referencia: id,
            fecha: Timestamp.now(),
            usuario: 'sistema'
          });
        }
      }
    }
  }

  // ── MOVIMIENTOS ──────────────────────────────────────────────────────────
  async registrarMovimiento(mov: Movimiento): Promise<void> {
    await addDoc(collection(this.db, 'movimientos'), mov);
  }

  async getMovimientos(): Promise<Movimiento[]> {
    const q = query(collection(this.db, 'movimientos'), orderBy('fecha', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Movimiento));
  }

  // ── DASHBOARD STATS ──────────────────────────────────────────────────────
  async getDashboardStats() {
    const [ventas, pedidos, clientes, productos] = await Promise.all([
      this.getVentas(),
      this.getPedidos(),
      this.getClientes(),
      this.getProductos()
    ]);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const ventasHoy = ventas.filter(v => {
      const fecha = v.fecha instanceof Timestamp ? v.fecha.toDate() : new Date(v.fecha as any);
      return fecha >= hoy && v.estado === 'completada';
    });

    const totalHoy = ventasHoy.reduce((sum, v) => sum + v.total, 0);

    const productosStockBajo = productos.filter(p => p.stock <= p.stockMinimo);

    return {
      totalVentasHoy: totalHoy,
      ventasHoyCount: ventasHoy.length,
      totalClientes: clientes.filter(c => c.activo).length,
      pedidosPendientes: pedidos.filter(p => p.estado === 'pendiente').length,
      stockBajo: productosStockBajo.length,
      totalVentas: ventas.filter(v => v.estado === 'completada').reduce((s, v) => s + v.total, 0),
      topProductos: this.calcularTopProductos(ventas)
    };
  }

  private calcularTopProductos(ventas: Venta[]) {
    const mapa: Record<string, { nombre: string; total: number }> = {};
    ventas.filter(v => v.estado === 'completada').forEach(v => {
      v.productos.forEach(p => {
        if (!mapa[p.productoId]) mapa[p.productoId] = { nombre: p.productoNombre, total: 0 };
        mapa[p.productoId].total += p.cantidad;
      });
    });
    return Object.values(mapa).sort((a, b) => b.total - a.total).slice(0, 5);
  }
}
