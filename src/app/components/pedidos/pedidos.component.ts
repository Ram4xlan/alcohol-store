import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService, Pedido, Producto } from '../../services/firebase.service';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pedidos.component.html',
  styleUrls: ['./pedidos.component.scss']
})
export class PedidosComponent implements OnInit {
  pedidos: Pedido[] = [];
  productos: Producto[] = [];
  showModal = false;
  guardando = false;
  filtroEstado = '';
  form: any = this.emptyForm();

  constructor(private fb: FirebaseService) {}
  async ngOnInit() { await this.cargar(); }

  async cargar() {
    [this.pedidos, this.productos] = await Promise.all([
      this.fb.getPedidos(), this.fb.getProductos()
    ]);
  }

  emptyForm() {
    return { proveedor: '', productos: [], total: 0, estado: 'pendiente', notas: '' };
  }

  get pedidosFiltrados(): Pedido[] {
    if (!this.filtroEstado) return this.pedidos;
    return this.pedidos.filter(p => p.estado === this.filtroEstado);
  }

  abrirModal() { this.form = this.emptyForm(); this.showModal = true; }
  cerrarModal() { this.showModal = false; }

  agregarItem() {
    this.form.productos.push({ productoId: '', productoNombre: '', cantidad: 1, costoUnitario: 0, subtotal: 0 });
  }

  quitarItem(i: number) { this.form.productos.splice(i, 1); this.calcularTotal(); }

  onProductoChange(i: number) {
    const item = this.form.productos[i];
    const prod = this.productos.find(p => p.id === item.productoId);
    if (prod) {
      item.productoNombre = prod.nombre;
      item.costoUnitario = prod.precioCompra;
      item.subtotal = prod.precioCompra * item.cantidad;
    }
    this.calcularTotal();
  }

  calcularTotal() {
    this.form.productos.forEach((item: any) => {
      item.subtotal = item.costoUnitario * item.cantidad;
    });
    this.form.total = this.form.productos.reduce((s: number, p: any) => s + p.subtotal, 0);
  }

  async guardarPedido() {
    if (!this.form.proveedor || this.form.productos.length === 0) {
      alert('Indica el proveedor y agrega al menos un producto.');
      return;
    }
    this.guardando = true;
    try {
      await this.fb.addPedido({ ...this.form });
      await this.cargar();
      this.cerrarModal();
    } catch (e) { console.error(e); }
    this.guardando = false;
  }

  async cambiarEstado(p: Pedido, estado: string) {
    const msg: Record<string, string> = {
      enviado: '¿Marcar pedido como enviado?',
      recibido: '¿Confirmar recepción del pedido? Esto actualizará el stock.',
      cancelado: '¿Cancelar este pedido?'
    };
    if (!confirm(msg[estado] || '¿Cambiar estado?')) return;
    await this.fb.updatePedido(p.id!, { estado: estado as any });
    await this.cargar();
  }

  formatFecha(fecha: any): string {
    const d = fecha instanceof Timestamp ? fecha.toDate() : new Date(fecha);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
