// Componente para mostrar las tareas de un tipo de deber
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskTypeService } from '../../services/taskType.service';

@Component({
  selector: 'app-category',
  standalone: true,
  templateUrl: './category.component.html',
  styleUrls: [],
  imports: [CommonModule, FormsModule],
})
export class CategoryComponent {
  // Nombre del tipo de tarea actual (clave Firebase)
  taskTypeName: string = '';
  taskTypeDisplayName: string = '';
  editedOriginalName: string = '';

  // Modal de edición
  isEditModalOpen: boolean = false;
  editedTask: any = {};

  // Modal de eliminación
  isDeleteModalOpen: boolean = false;
  taskToDeleteKey: string = '';

  // Lista de tareas cargadas
  tasks: {
    nombre: string;
    nota?: string;
    fecha?: string;
    estado: 'realizado' | 'pendiente' | 'no realizado' | 'para hoy';
  }[] = [];

  // Estado para el modal de agregar
  isAddModalOpen: boolean = false;

  // Tarea nueva temporal
  newTask = {
    nombre: '',
    nota: '',
    fecha: '',
    estado: 'pendiente' as
      | 'pendiente'
      | 'realizado'
      | 'no realizado'
      | 'para hoy',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService,
    private taskTypeService: TaskTypeService
  ) {}

  // Carga inicial del tipo de tarea y sus tareas asociadas
  ngOnInit(): void {
    this.taskTypeName = this.route.snapshot.paramMap.get('name') || '';
    console.log('[INIT] Tareas para tipo:', this.taskTypeName);
    this.loadTasks();
    this.loadTaskTypeDisplayName();
  }

  // Carga y ajusta estados de las tareas automáticamente
  loadTasks(): void {
    this.taskService.getTasks(this.taskTypeName).subscribe({
      next: (tasks) => {
        const hoy = new Date();
        const hoyFecha = new Date(
          hoy.getFullYear(),
          hoy.getMonth(),
          hoy.getDate()
        ); // hoy a las 00:00

        console.log(
          '[DEBUG] Fecha actual local:',
          hoy.toISOString(),
          '| Solo fecha:',
          hoyFecha.toDateString()
        );

        this.tasks = tasks.map((task) => {
          if (task.estado === 'realizado') return task;

          if (!task.fecha) {
            task.estado = 'pendiente';
          } else {
            const fechaTarea = this.parseFechaLocal(task.fecha);
            console.log(
              '[DEBUG] Tarea:',
              task.nombre,
              '| Fecha tarea:',
              fechaTarea.toDateString()
            );

            if (fechaTarea.getTime() === hoyFecha.getTime()) {
              task.estado = 'para hoy';
            } else if (fechaTarea.getTime() < hoyFecha.getTime()) {
              task.estado = 'no realizado';
            } else {
              task.estado = 'pendiente';
            }
          }

          return task;
        });

        // Guardar los cambios en Firebase
        this.tasks.forEach((task) => {
          const key = task.nombre.trim().toLowerCase().replace(/\s+/g, '_');
          this.taskService.updateTask(this.taskTypeName, key, task).subscribe();
        });

        console.log('[TAREAS]', this.tasks);
      },
      error: (err) => console.error('[ERROR] Al cargar tareas:', err),
    });
  }

  // Regresa al home
  goBack(): void {
    this.router.navigate(['/app/home']);
  }

  // Cambia el estado de la tarea y lo guarda en Firebase
  toggleTaskStatus(task: any): void {
    const estados = ['pendiente', 'para hoy', 'realizado', 'no realizado'];
    const actual = task.estado;
    const index = estados.indexOf(actual);
    const siguiente = estados[(index + 1) % estados.length];

    const updatedTask = { ...task, estado: siguiente };

    const key = task.nombre.trim().toLowerCase().replace(/\s+/g, '_');

    this.taskService.updateTask(this.taskTypeName, key, updatedTask).subscribe({
      next: () => this.loadTasks(),
      error: (err) => console.error('[ERROR] Al cambiar estado:', err),
    });
  }

  // Abre el modal para nueva tarea
  openAddModal(): void {
    this.isAddModalOpen = true;
    this.newTask = {
      nombre: '',
      nota: '',
      fecha: '',
      estado: 'pendiente',
    };
  }

  // Cierra el modal de nueva tarea
  closeAddModal(): void {
    this.isAddModalOpen = false;
    this.newTask = {
      nombre: '',
      nota: '',
      fecha: '',
      estado: 'pendiente',
    };
  }

  // Agrega una nueva tarea a Firebase
  addTask(): void {
    if (!this.newTask.nombre.trim()) return;

    this.taskService.addTask(this.taskTypeName, this.newTask).subscribe({
      next: () => {
        this.loadTasks();
        this.closeAddModal();
      },
      error: (err) => console.error('[ERROR] Al agregar tarea:', err),
    });
  }

  // Abre modal de edición (por implementar)
  openEditModal(task: any): void {
    this.editedTask = { ...task }; // copia los datos de la tarea
    this.editedOriginalName = task.nombre; // guarda el nombre original
    this.isEditModalOpen = true;
  }

  // Confirma la edición de la tarea seleccionada
  saveTaskEdit(): void {
    if (!this.editedTask?.nombre?.trim()) return;

    const newKey = this.editedTask.nombre
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_');

    const oldKey = this.editedOriginalName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_');

    // ✅ actualiza nombre visible sin "_"
    this.editedTask.nombre = this.editedTask.nombre.trim();

    if (newKey !== oldKey) {
      this.taskService.deleteTask(this.taskTypeName, oldKey).subscribe();
    }

    this.taskService
      .updateTask(this.taskTypeName, newKey, this.editedTask)
      .subscribe({
        next: () => {
          this.loadTasks();
          this.closeEditModal();
        },
        error: (err) => console.error('[ERROR] Al editar tarea:', err),
      });
  }

  // Cierra el modal de edición
  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editedTask = {};
  }

  // Abre modal de eliminación (por implementar)
  openDeleteModal(task: any): void {
    this.taskToDeleteKey = task.nombre.trim().toLowerCase().replace(/\s+/g, '_'); // ✅ clave real
    this.isDeleteModalOpen = true;
  }

  // Confirma la eliminación de la tarea seleccionada
  confirmDeleteTask(): void {
    this.taskService
      .deleteTask(this.taskTypeName, this.taskToDeleteKey)
      .subscribe({
        next: () => {
          this.loadTasks();
          this.closeDeleteModal();
        },
        error: (err) => console.error('[ERROR] Al eliminar tarea:', err),
      });
  }

  // Cierra el modal de eliminación
  closeDeleteModal(): void {
    this.taskToDeleteKey = '';
    this.isDeleteModalOpen = false;
  }

  // Carga el nombre visual del tipo de tarea desde Firebase
  loadTaskTypeDisplayName(): void {
    this.taskTypeService.getAllTaskTypes().subscribe({
      next: (types) => {
        const match = types.find((t) => t.key === this.taskTypeName);
        this.taskTypeDisplayName = match?.nombre || this.taskTypeName;
      },
      error: (err) => console.error('[ERROR] Al obtener nombre visual:', err),
    });
  }

  // Cambia el estado de la tarea y lo guarda en Firebase
  changeTaskStatus(task: any): void {
    const key = task.nombre.trim().toLowerCase().replace(/\s+/g, '_');
    this.taskService.updateTask(this.taskTypeName, key, task).subscribe({
      next: () => this.loadTasks(),
      error: (err) => console.error('[ERROR] Al actualizar estado:', err),
    });
  }
  // Devuelve clase de color según estado y fecha
  getEstadoColor(task: any): string {
    const hoy = new Date();
    const fechaTarea = task.fecha ? new Date(task.fecha) : null;

    if (task.estado === 'realizado') return 'bg-teal-600';
    if (task.estado === 'para hoy') return 'bg-orange-600';
    if (task.estado === 'no realizado' && fechaTarea && fechaTarea < hoy)
      return 'bg-red-600';
    return 'bg-slate-500'; // pendiente u otro
  }

  // Parsea un string yyyy-MM-dd como fecha local sin zona horaria
  parseFechaLocal(fechaStr: string): Date {
    const [year, month, day] = fechaStr.split('-').map(Number);
    return new Date(year, month - 1, day); // mes va de 0-11
  }
}
