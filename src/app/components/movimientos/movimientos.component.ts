import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService, Movimiento } from '../../services/firebase.service';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './movimientos.component.html',
  styleUrls: ['./movimientos.component.scss']
})
export class MovimientosComponent implements OnInit {
  movimientos: Movimiento[] = [];
  cargando = true;
  filtroTipo = '';
  busqueda = '';

  constructor(private fb: FirebaseService) {}
  async ngOnInit() { await this.cargar(); }

  async cargar() {
    this.cargando = true;
    this.movimientos = await this.fb.getMovimientos();
    this.cargando = false;
  }

  get movimientosFiltrados(): Movimiento[] {
    return this.movimientos.filter(m => {
      const matchTipo = !this.filtroTipo || m.tipo === this.filtroTipo;
      const matchBusq = !this.busqueda || m.productoNombre.toLowerCase().includes(this.busqueda.toLowerCase());
      return matchTipo && matchBusq;
    });
  }

  get totalEntradas(): number {
    return this.movimientosFiltrados.filter(m => m.cantidad > 0).reduce((s, m) => s + m.cantidad, 0);
  }

  get totalSalidas(): number {
    return this.movimientosFiltrados.filter(m => m.cantidad < 0).reduce((s, m) => s + m.cantidad, 0);
  }

  formatFecha(fecha: any): string {
    const d = fecha instanceof Timestamp ? fecha.toDate() : new Date(fecha);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
