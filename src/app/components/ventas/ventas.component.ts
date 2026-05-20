import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService, Venta, Cliente, Producto } from '../../services/firebase.service';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ventas.component.html',
  styleUrls: ['./ventas.component.scss']
})
export class VentasComponent implements OnInit {
  ventas: Venta[] = [];
  clientes: Cliente[] = [];
  productos: Producto[] = [];
  showModal = false;
  guardando = false;
  busqueda = '';
  filtroEstado = '';
  ventaDetalle: Venta | null = null;

  form: any = this.emptyForm();

  constructor(private fb: FirebaseService) {}

  async ngOnInit() {
    await this.cargarDatos();
  }

  async cargarDatos() {
    [this.ventas, this.clientes, this.productos] = await Promise.all([
      this.fb.getVentas(), this.fb.getClientes(), this.fb.getProductos()
    ]);
  }

  emptyForm() {
    return { clienteId: '', clienteNombre: '', productos: [], subtotal: 0, descuento: 0, total: 0, metodoPago: 'efectivo', notas: '', estado: 'completada' };
  }

  get ventasFiltradas(): Venta[] {
    return this.ventas.filter(v => {
      const matchBusq = !this.busqueda || v.clienteNombre.toLowerCase().includes(this.busqueda.toLowerCase());
      const matchEstado = !this.filtroEstado || v.estado === this.filtroEstado;
      return matchBusq && matchEstado;
    });
  }

  abrirModal() { this.form = this.emptyForm(); this.showModal = true; }
  cerrarModal() { this.showModal = false; }

  onClienteChange() {
    const c = this.clientes.find(x => x.id === this.form.clienteId);
    this.form.clienteNombre = c ? `${c.nombre} ${c.apellido}` : '';
  }

  agregarItem() {
    this.form.productos.push({ productoId: '', productoNombre: '', cantidad: 1, precioUnitario: 0, subtotal: 0 });
  }

  quitarItem(i: number) { this.form.productos.splice(i, 1); this.calcularTotales(); }

  onProductoChange(i: number) {
    const item = this.form.productos[i];
    const prod = this.productos.find(p => p.id === item.productoId);
    if (prod) {
      item.productoNombre = prod.nombre;
      item.precioUnitario = prod.precioVenta;
      item.subtotal = prod.precioVenta * item.cantidad;
    }
    this.calcularTotales();
  }

  calcularTotales() {
    this.form.productos.forEach((item: any) => {
      item.subtotal = item.precioUnitario * item.cantidad;
    });
    this.form.subtotal = this.form.productos.reduce((s: number, p: any) => s + p.subtotal, 0);
    this.form.total = Math.max(0, this.form.subtotal - (this.form.descuento || 0));
  }

  async guardarVenta() {
    if (!this.form.clienteId || this.form.productos.length === 0) {
      alert('Selecciona cliente y agrega al menos un producto.');
      return;
    }
    this.guardando = true;
    try {
      await this.fb.addVenta({ ...this.form });
      await this.cargarDatos();
      this.cerrarModal();
    } catch (e) { console.error(e); }
    this.guardando = false;
  }

  async cancelarVenta(v: Venta) {
    if (!confirm('¿Cancelar esta venta?')) return;
    await this.fb.updateVenta(v.id!, { estado: 'cancelada' });
    await this.cargarDatos();
  }

  verDetalle(v: Venta) { this.ventaDetalle = v; }

  formatFecha(fecha: any): string {
    const d = fecha instanceof Timestamp ? fecha.toDate() : new Date(fecha);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
