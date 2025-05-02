// Servicio para gestionar tipos de tareas desde Firebase sin initializeApp
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { DateService } from './date.service';
import { HttpClient } from '@angular/common/http';
import { map, switchMap, catchError } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TaskTypeService {
  // URL base de Firebase
  private dbUrl = 'https://misdeberes-fac01-default-rtdb.firebaseio.com';

  constructor(
    private authService: AuthService,
    private dateService: DateService,
    private http: HttpClient
  ) {}

  // Genera la ruta del usuario actual con año y mes
  private getPath(): string | null {
    const user = this.authService.getUser();
    const year = this.dateService.getSelectedYear();
    const month = this.dateService.getSelectedMonth();
    if (!user?.id || !year || !month) return null;
    return `${this.dbUrl}/${user.id}/${year}/${month}/categorias`;
  }

  // Limpia texto para usarlo como key
  private sanitizeKey(key: string): string {
    return key.trim().toLowerCase().replace(/\s+/g, '_');
  }

  // Obtiene todos los nombres de tipos de tarea como objetos
  getAllTaskTypes(): Observable<{ key: string; nombre: string }[]> {
    const path = this.getPath();
    if (!path) return of([]);

    const url = `${path}.json`;
    return this.http.get<{ [key: string]: any }>(url).pipe(
      map((response) => {
        return response
          ? Object.keys(response).map((key) => ({
              key,
              nombre: response[key]?.nombre || key,
            }))
          : [];
      }),
      catchError((err) => {
        console.error('[ERROR][GET TYPES]', err);
        return of([]);
      })
    );
  }

  // Agrega un nuevo tipo de tarea
  addTaskType(nombre: string): Observable<any> {
    const path = this.getPath();
    if (!path) return throwError(() => new Error('Ruta no válida'));
    const key = this.sanitizeKey(nombre);
    const url = `${path}/${key}.json`;
    return this.http.put(url, { tareas: {}, nombre });
  }

  // Elimina tipo de tarea por key
  deleteTaskType(key: string): Observable<any> {
    const path = this.getPath();
    if (!path) return throwError(() => new Error('Ruta no válida'));
    const url = `${path}/${key}.json`;
    return this.http.delete(url);
  }

  // Edita tipo de tarea (renombra)
  editTaskType(oldKey: string, newNombre: string): Observable<any> {
    const path = this.getPath();
    if (!path) return throwError(() => new Error('Ruta no válida'));
    const newKey = this.sanitizeKey(newNombre);

    const oldUrl = `${path}/${oldKey}.json`;
    const newUrl = `${path}/${newKey}.json`;

    return this.http.get(oldUrl).pipe(
      switchMap((data: any) => {
        const contenido = { ...data, nombre: newNombre };
        return this.http.put(newUrl, contenido);
      }),
      switchMap(() => this.http.delete(oldUrl)),
      catchError((err) => {
        console.error('[ERROR][EDIT TYPE]', err);
        return throwError(() => err);
      })
    );
  }
}
