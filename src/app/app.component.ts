import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { VentasComponent } from './components/ventas/ventas.component';
import { PedidosComponent } from './components/pedidos/pedidos.component';
import { ClientesComponent } from './components/clientes/clientes.component';
import { InventarioComponent } from './components/inventario/inventario.component';
import { MovimientosComponent } from './components/movimientos/movimientos.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    DashboardComponent,
    VentasComponent,
    PedidosComponent,
    ClientesComponent,
    InventarioComponent,
    MovimientosComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  activeView = 'dashboard';
  sidebarCollapsed = false;

  pageTitles: Record<string, string> = {
    dashboard: 'Dashboard General',
    ventas: 'Gestión de Ventas',
    pedidos: 'Control de Pedidos',
    clientes: 'Base de Clientes',
    inventario: 'Inventario de Productos',
    movimientos: 'Historial de Movimientos'
  };

  get fechaHoy(): string {
    return new Date().toLocaleDateString('es-MX', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  setView(view: string) { this.activeView = view; }
  toggleSidebar() { this.sidebarCollapsed = !this.sidebarCollapsed; }
}
