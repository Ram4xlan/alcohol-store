import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService, Producto } from '../../services/firebase.service';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.scss']
})
export class InventarioComponent implements OnInit {
  productos: Producto[] = [];
  showModal = false;
  editando = false;
  guardando = false;
  busqueda = '';
  filtroCategoria = '';
  editandoId = '';
  form: Partial<Producto> = this.emptyForm();

  constructor(private fb: FirebaseService) {}
  async ngOnInit() { await this.cargar(); }
  async cargar() { this.productos = await this.fb.getProductos(); }

  emptyForm(): Partial<Producto> {
    return { nombre: '', marca: '', categoria: 'destilado', presentacion: '', precioCompra: 0, precioVenta: 0, stock: 0, stockMinimo: 5, proveedor: '', activo: true };
  }

  get productosFiltrados(): Producto[] {
    return this.productos.filter(p => {
      const matchB = !this.busqueda || p.nombre.toLowerCase().includes(this.busqueda.toLowerCase()) || p.marca.toLowerCase().includes(this.busqueda.toLowerCase());
      const matchC = !this.filtroCategoria || p.categoria === this.filtroCategoria;
      return matchB && matchC;
    });
  }

  get productosStockBajo(): Producto[] {
    return this.productos.filter(p => p.stock <= p.stockMinimo);
  }

  abrirModal() { this.form = this.emptyForm(); this.editando = false; this.showModal = true; }
  cerrarModal() { this.showModal = false; }

  editarProducto(p: Producto) {
    this.form = { ...p };
    this.editandoId = p.id!;
    this.editando = true;
    this.showModal = true;
  }

  async guardarProducto() {
    if (!this.form.nombre || !this.form.marca) { alert('Nombre y marca son obligatorios.'); return; }
    this.guardando = true;
    try {
      if (this.editando) {
        await this.fb.updateProducto(this.editandoId, this.form);
      } else {
        await this.fb.addProducto(this.form as Producto);
      }
      await this.cargar();
      this.cerrarModal();
    } catch (e) { console.error(e); }
    this.guardando = false;
  }

  async eliminarProducto(p: Producto) {
    if (!confirm(`¿Eliminar ${p.nombre}?`)) return;
    await this.fb.updateProducto(p.id!, { activo: false });
    await this.cargar();
  }
}
