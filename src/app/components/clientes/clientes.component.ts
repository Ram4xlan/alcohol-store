import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService, Cliente } from '../../services/firebase.service';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.scss']
})
export class ClientesComponent implements OnInit {
  clientes: Cliente[] = [];
  showModal = false;
  editando = false;
  guardando = false;
  busqueda = '';
  editandoId = '';

  form: Partial<Cliente> = this.emptyForm();

  constructor(private fb: FirebaseService) {}
  async ngOnInit() { await this.cargar(); }
  async cargar() { this.clientes = await this.fb.getClientes(); }

  emptyForm(): Partial<Cliente> {
    return { nombre: '', apellido: '', telefono: '', email: '', direccion: '', rfc: '', activo: true };
  }

  get clientesFiltrados(): Cliente[] {
    if (!this.busqueda) return this.clientes;
    const b = this.busqueda.toLowerCase();
    return this.clientes.filter(c =>
      `${c.nombre} ${c.apellido}`.toLowerCase().includes(b) ||
      c.email.toLowerCase().includes(b) ||
      c.telefono.includes(b)
    );
  }

  abrirModal() { this.form = this.emptyForm(); this.editando = false; this.showModal = true; }
  cerrarModal() { this.showModal = false; }

  editarCliente(c: Cliente) {
    this.form = { ...c };
    this.editandoId = c.id!;
    this.editando = true;
    this.showModal = true;
  }

  async guardarCliente() {
    if (!this.form.nombre || !this.form.apellido || !this.form.telefono) {
      alert('Nombre, apellido y teléfono son obligatorios.');
      return;
    }
    this.guardando = true;
    try {
      if (this.editando) {
        await this.fb.updateCliente(this.editandoId, this.form);
      } else {
        await this.fb.addCliente(this.form as Cliente);
      }
      await this.cargar();
      this.cerrarModal();
    } catch (e) { console.error(e); }
    this.guardando = false;
  }

  async eliminarCliente(c: Cliente) {
    if (!confirm(`¿Desactivar al cliente ${c.nombre} ${c.apellido}?`)) return;
    await this.fb.deleteCliente(c.id!);
    await this.cargar();
  }
}
