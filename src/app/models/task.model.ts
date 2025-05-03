export interface Task {
  nombre: string;
  nota?: string;
  fecha?: string;
  estado: 'pendiente' | 'para hoy' | 'realizado' | 'no realizado';
  tipo?: string; // ✅ categoría de la tarea
}
