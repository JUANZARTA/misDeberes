// Servicio para obtener, agregar, editar y eliminar tareas
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { DateService } from './date.service';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';

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
              nombre: key,
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

    return this.http.patch(url, {
      [nombreKey]: tarea,
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
}
