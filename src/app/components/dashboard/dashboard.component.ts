import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseService, Venta } from '../../services/firebase.service';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  stats: any = null;
  ventasRecientes: Venta[] = [];

  constructor(private fb: FirebaseService) {}

  async ngOnInit() {
    this.stats = await this.fb.getDashboardStats();
    const ventas = await this.fb.getVentas();
    this.ventasRecientes = ventas.slice(0, 8);
  }

  formatFecha(fecha: any): string {
    const d = fecha instanceof Timestamp ? fecha.toDate() : new Date(fecha);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  getBarPct(val: number, list: any[]): number {
    const max = list[0]?.total || 1;
    return Math.round((val / max) * 100);
  }
}
