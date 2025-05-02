// Home para visualizar, crear, editar y eliminar tipos de tarea
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TaskTypeService } from '../../services/taskType.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: [],
  imports: [CommonModule, FormsModule],
})
export class HomeComponent {
  // Lista de tipos de tareas
  taskTypes: { key: string, nombre: string }[] = [];

  // Estado del modal para crear tipo
  isModalOpen = false;

  // Nuevo tipo de tarea
  newTaskType = '';

  // Modal lateral: editar
  isEditModalOpen: boolean = false;
  taskTypeToEdit: string = '';
  editedTaskType: string = '';

  // Modal lateral: eliminar
  isDeleteModalOpen: boolean = false;
  taskTypeToDelete: string = '';

  constructor(
    private taskTypeService: TaskTypeService,
    private router: Router
  ) {}

  // Carga inicial de tipos al entrar al componente
  ngOnInit(): void {
    console.log('[INIT] Home cargado');
    this.loadTaskTypes();
  }

  // Consulta todos los tipos de tareas existentes
  loadTaskTypes(): void {
    this.taskTypeService.getAllTaskTypes().subscribe({
      next: (types) => {
        console.log('[GET] Tipos cargados:', types);
        this.taskTypes = types;
      },
      error: (err) => {
        console.error('[ERROR] Al obtener tipos de tarea:', err);
      },
    });
  }

  // Abre el modal de creación
  openModal(): void {
    this.isModalOpen = true;
  }

  // Cierra el modal de creación
  closeModal(): void {
    this.isModalOpen = false;
    this.newTaskType = '';
  }

  // Agrega un nuevo tipo de tarea
  addTaskType(): void {
    if (this.newTaskType.trim()) {
      this.taskTypeService.addTaskType(this.newTaskType).subscribe({
        next: () => {
          this.loadTaskTypes();
          this.closeModal();
        },
        error: (err) => {
          console.error('[ERROR] Al agregar tipo:', err);
        },
      });
    }
  }

  // cuando haces click en ingresar, debes pasar el objeto, no string
  enterTaskType(taskType: any): void {
    console.log('[NAVIGATE TO]', taskType);
    this.router.navigate(['/app/category', taskType.key]);
  }


  // ------------------ MODAL DE EDICIÓN ------------------

  openEditModal(task: { key: string; nombre: string }): void {
    this.taskTypeToEdit = task.key;
    this.editedTaskType = task.nombre;
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editedTaskType = '';
    this.taskTypeToEdit = '';
  }

  saveTaskTypeEdit(): void {
    if (this.editedTaskType.trim() && this.taskTypeToEdit) {
      this.taskTypeService
        .editTaskType(this.taskTypeToEdit, this.editedTaskType)
        .subscribe({
          next: () => {
            this.loadTaskTypes();
            this.closeEditModal();
          },
          error: (err) => console.error('[ERROR] Al editar tipo:', err),
        });
    }
  }

  // ------------------ MODAL DE ELIMINACIÓN ------------------

  openDeleteModal(task: { key: string; nombre: string }): void {
    this.taskTypeToDelete = task.key;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.taskTypeToDelete = '';
    this.isDeleteModalOpen = false;
  }

  confirmDeleteTaskType(): void {
    if (this.taskTypeToDelete) {
      this.taskTypeService.deleteTaskType(this.taskTypeToDelete).subscribe({
        next: () => {
          this.loadTaskTypes();
          this.closeDeleteModal();
        },
        error: (err) => console.error('[ERROR] Al eliminar tipo:', err),
      });
    }
  }
}
