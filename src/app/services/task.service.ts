// Servicio para obtener, agregar, editar y eliminar tareas
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { DateService } from './date.service';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';
import { Task } from '../models/task.model'; // Asegúrate de crear este archivo
import { format } from 'date-fns';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  // URL base de Firebase
  private dbUrl = 'https://misdeberes-fac01-default-rtdb.firebaseio.com';

  constructor(
    private authService: AuthService,
    private dateService: DateService,
    private http: HttpClient
  ) {}

  // Retorna el path absoluto del tipo de tarea actual
  private getPath(taskType: string): string | null {
    const user = this.authService.getUser();
    const year = this.dateService.getSelectedYear();
    const month = this.dateService.getSelectedMonth();
    if (!user?.id || !year || !month) return null;
    return `${this.dbUrl}/${user.id}/${year}/${month}/categorias/${taskType}/tareas`;
  }

  // Consulta todas las tareas de un tipo de tarea
  getTasks(taskType: string): Observable<any[]> {
    const path = this.getPath(taskType);
    if (!path) return of([]);

    return this.http.get<{ [key: string]: any }>(`${path}.json`).pipe(
      map((res) => {
        return res
          ? Object.keys(res).map((key) => ({
              ...res[key],
              nombre: res[key].nombre || key, // ✅ usa el nombre limpio si existe
            }))
          : [];
      }),
      catchError((err) => {
        console.error('[ERROR][GET TASKS]', err);
        return of([]);
      })
    );
  }

  // Agrega una nueva tarea a la base de datos
  addTask(taskType: string, tarea: any): Observable<any> {
    const path = this.getPath(taskType);
    if (!path || !tarea?.nombre)
      return throwError(() => new Error('Datos inválidos'));

    const nombreKey = tarea.nombre.trim().toLowerCase().replace(/\s+/g, '_');
    const url = `${path}.json`;

    const tareaConNombreOriginal = {
      ...tarea,
      nombre: tarea.nombre.trim(), // 👈 nombre limpio para mostrar
    };

    return this.http.patch(url, {
      [nombreKey]: tareaConNombreOriginal,
    });
  }

  // Elimina una tarea específica de una categoría
  deleteTask(taskType: string, taskKey: string): Observable<any> {
    const path = this.getPath(taskType);
    if (!path || !taskKey)
      return throwError(() => new Error('Datos inválidos'));

    const url = `${path}/${taskKey}.json`;
    return this.http.delete(url);
  }

  // Actualiza una tarea sobrescribiéndola completamente
  updateTask(taskType: string, taskKey: string, tarea: any): Observable<any> {
    const path = this.getPath(taskType);
    if (!path || !taskKey || !tarea)
      return throwError(() => new Error('Datos inválidos'));

    const url = `${path}/${taskKey}.json`;
    return this.http.put(url, tarea);
  }

  // Actualiza el estado de una tarea específica
  getTodayTasks(): Observable<Task[]> {
    const user = this.authService.getUser();
    const year = this.dateService.getSelectedYear();
    const month = this.dateService.getSelectedMonth();
    const today = format(new Date(), 'yyyy-MM-dd');

    if (!user?.id || !year || !month) return of([]);

    const url = `${this.dbUrl}/${user.id}/${year}/${month}/categorias.json`;

    return this.http.get<{ [key: string]: any }>(url).pipe(
      map((categorias) => {
        const tareasHoy: Task[] = [];

        if (!categorias) return [];

        Object.entries(categorias).forEach(([tipo, categoria]: [string, any]) => {
          if (categoria?.tareas) {
            Object.entries(categoria.tareas).forEach(([nombre, tarea]: [string, any]) => {
              if (tarea.fecha === today) {
                tareasHoy.push({
                  nombre: tarea.nombre || nombre,
                  nota: tarea.nota || '',
                  fecha: tarea.fecha,
                  estado: tarea.estado || 'pendiente',
                  tipo: tipo // ✅ agregamos el tipo aquí
                } as Task);
              }
            });
          }
        });

        return tareasHoy;
      }),
      catchError((err) => {
        console.error('[ERROR][GET TODAY TASKS]', err);
        return of([]);
      })
    );
  }

  // Actualiza el estado de una tarea específica
  getAllTasks(): Observable<Task[]> {
    const user = this.authService.getUser();
    const year = this.dateService.getSelectedYear();
    const month = this.dateService.getSelectedMonth();

    if (!user?.id || !year || !month) return of([]);

    const url = `${this.dbUrl}/${user.id}/${year}/${month}/categorias.json`;

    return this.http.get<{ [key: string]: any }>(url).pipe(
      map((categorias) => {
        const todasLasTareas: Task[] = [];

        if (!categorias) return [];

        Object.entries(categorias).forEach(([tipo, categoria]: [string, any]) => {
          if (categoria?.tareas) {
            Object.entries(categoria.tareas).forEach(([nombre, tarea]: [string, any]) => {
              todasLasTareas.push({
                nombre: tarea.nombre || nombre,
                nota: tarea.nota || '',
                fecha: tarea.fecha || '',
                estado: tarea.estado || 'pendiente',
                tipo: tipo // ✅ importante para categorizar luego
              } as Task);
            });
          }
        });

        return todasLasTareas;
      }),
      catchError((err) => {
        console.error('[ERROR][GET ALL TASKS]', err);
        return of([]);
      })
    );
  }


}
