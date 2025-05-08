import { Injectable } from '@angular/core';

export interface Notificacion {
  id: string;
  mensaje: string;
  fecha: Date;
  leido: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private notifications: Notificacion[] = [];

  // Metodo para obtener todas las notificaciones
  getAll(): Notificacion[] {
    return [...this.notifications];
  }

  // Metodo para obtener una notificacion por id
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.leido).length;
  }

  // Metodo para adiir una notificacion
  add(mensaje: string): void {
    const nueva: Notificacion = {
      id: crypto.randomUUID(),
      mensaje,
      fecha: new Date(),
      leido: false
    };
    this.notifications.unshift(nueva);
  }

  // Metodo para eliminar una notificacion
  markAsRead(id: string): void {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) notif.leido = true;
  }

  // Metodo para eliminar una notificacion por id
  clear(): void {
    this.notifications = [];
  }
}
