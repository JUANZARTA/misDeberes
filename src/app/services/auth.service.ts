import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, forkJoin, of } from 'rxjs';
import { catchError, tap, map, switchMap } from 'rxjs/operators';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

export interface Notificacion {
  mensaje: string;
  leido: boolean;
  fecha: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiKey = 'AIzaSyCXaTov5g6_qWHoxHdI39tLzEH7VQx5ttw';
  private baseUrl = 'https://identitytoolkit.googleapis.com/v1/accounts';
  private dbUrl = 'https://misdeberes-fac01-default-rtdb.firebaseio.com';

  constructor(private http: HttpClient) {}

  //| Método para iniciar sesión con email y contraseña
  login(email: string, password: string): Observable<any> {
    const url = `${this.baseUrl}:signInWithPassword?key=${this.apiKey}`;
    const body = { email, password, returnSecureToken: true };

    return this.http.post(url, body).pipe(
      tap((res: any) => localStorage.setItem('user', JSON.stringify(res))),
      catchError((err) => throwError(() => err.error.error.message))
    );
  }

  //| Método para iniciar sesión con Google
  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('selectedYear');
    localStorage.removeItem('selectedMonth');
  }

  //| Método para cerrar sesión
  isLoggedIn(): boolean {
    return !!localStorage.getItem('user');
  }

  //| Método para verificar si el usuario está autenticado
  getUser() {
    const data = localStorage.getItem('user');
    if (!data) return null;

    const parsed = JSON.parse(data);

    // 🔧 Soporte para sesiones que todavía tienen localId
    return {
      id: parsed.id || parsed.localId,
      email: parsed.email,
    };
  }

  //| Método para obtener el token de Firebase
  register(email: string, password: string): Observable<any> {
    const url = `${this.baseUrl}:signUp?key=${this.apiKey}`;
    const body = { email, password, returnSecureToken: true };

    return this.http.post(url, body).pipe(
      tap((res: any) => localStorage.setItem('user', JSON.stringify(res))),
      catchError((err) => throwError(() => err.error.error.message))
    );
  }

  //| Método para guardar el perfil del usuario en la base de datos
  saveUserProfile(
    userId: string,
    name: string,
    correo: string
  ): Observable<any> {
    const url = `${this.dbUrl}/${userId}.json`;

    return this.http
      .put(url, {
        nombre: name,
        correo: correo,
        notificaciones: {
          '-notif1': {
            mensaje: 'Bienvenido a MisDeberes',
            leido: false,
            fecha: new Date().toLocaleString(),
          },
        },
      })
      .pipe(
        tap(() => {
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          storedUser.name = name;
          localStorage.setItem('user', JSON.stringify(storedUser));
        }),
        catchError(() => throwError(() => 'Error al guardar perfil'))
      );
  }

  //| Método para obtener el perfil del usuario
  getUserData(uid: string): Observable<any> {
    const url = `${this.dbUrl}/${uid}.json`;
    return this.http.get<any>(url);
  }

  //| Método para obtener el perfil del usuario por ID
  getUserNotifications(uid: string): Observable<Record<string, Notificacion>> {
    const url = `${this.dbUrl}/${uid}/notificaciones.json`;
    return this.http.get<Record<string, Notificacion>>(url);
  }

  //| Método para obtener las notificaciones del usuario
  markNotificationAsRead(uid: string, notifId: string): Observable<any> {
    const url = `${this.dbUrl}/${uid}/notificaciones/${notifId}/leido.json`;
    return this.http.put(url, true);
  }

  //| Método para eliminar una notificación del usuario
  addNotification(uid: string, mensaje: string): Observable<any> {
    const notificacionesUrl = `${this.dbUrl}/${uid}/notificaciones.json`;

    return this.getUserNotifications(uid).pipe(
      switchMap((data) => {
        const allNotifs = data ? Object.entries(data) : [];
        const total = allNotifs.length;

        if (total >= 20) {
          const sorted = allNotifs.sort(
            (a, b) =>
              new Date(a[1].fecha).getTime() - new Date(b[1].fecha).getTime()
          );
          const oldestKey = sorted[0][0];

          const deleteUrl = `${this.dbUrl}/${uid}/notificaciones/${oldestKey}.json`;
          return this.http.delete(deleteUrl).pipe(
            switchMap(() => {
              return this.http.post(notificacionesUrl, {
                mensaje,
                leido: false,
                fecha: new Date().toLocaleString(),
              });
            })
          );
        } else {
          return this.http.post(notificacionesUrl, {
            mensaje,
            leido: false,
            fecha: new Date().toLocaleString(),
          });
        }
      })
    );
  }

  //| Método para eliminar notificaciones antiguas (más de 7 días)
  cleanOldNotifications(uid: string): Observable<any> {
    return this.getUserNotifications(uid).pipe(
      switchMap((data) => {
        if (!data) return of(null);

        const now = new Date();
        const deletions = Object.entries(data)
          .filter(([_, notif]) => {
            const fecha = new Date(notif.fecha);
            const diffDays = Math.floor(
              (now.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24)
            );
            return diffDays >= 7;
          })
          .map(([key]) => {
            const delUrl = `${this.dbUrl}/${uid}/notificaciones/${key}.json`;
            return this.http.delete(delUrl);
          });

        return deletions.length > 0 ? forkJoin(deletions) : of(null);
      })
    );
  }

  // Método para guardar sesión local del usuario autenticado
  guardarSesion(userId: string, email: string): void {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: userId,
        email,
      })
    );
  }

  // Método para iniciar sesión con Google
  loginWithGoogle(): void {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithRedirect(provider);
  }

  // Método para obtener el token de Firebase
  startAutoLogout(): void {
    let timer: any;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        this.logout();
        // window.location.href = '/miCartera/login'; // Redirigir al login
        window.location.href = `${document.baseURI}login`;

      }, 5 * 60 * 1000); // 2 minutos
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('touchstart', resetTimer);

    resetTimer(); // Iniciar temporizador al entrar
  }
}
