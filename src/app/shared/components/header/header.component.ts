import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ElementRef,
  HostListener,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DateService } from '../../../services/date.service';
import { Subscription } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { Injectable } from '@angular/core';
import {
  NotificacionService,
  Notificacion,
} from '../../../services/notificacion.service';
import { TaskService } from '../../../services/task.service';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit, OnDestroy {
  showMonthModal = false;
  years: number[] = [];
  months: string[] = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
  @ViewChild('notifDropdown') notifDropdownRef: ElementRef | undefined;

  selectedYear: number | null = null;
  selectedMonth: number | null = null;
  currentYear: string = '';
  currentMonth: string = '';
  currentRoute: string = '';

  userName: string = '';

  isDarkMode = false;

  notifications: any[] = [];
  unreadCount: number = 0;
  showNotifications: boolean = false;

  private dateSubscription?: Subscription;
  private routeSubscription?: Subscription;
  private authService = inject(AuthService);

  constructor(
    private dateService: DateService,
    private router: Router,
    private notificacionService: NotificacionService,
    private taskService: TaskService // <--- agregado
  ) {}


  // Metodo para inicializar el componente
  ngOnInit(): void {
    this.generateYearRange(2025, 2050);
    this.syncNotificacionesLocales();

    const today = new Date();
    const defaultYear = today.getFullYear();
    const defaultMonth = today.getMonth();

    const savedYear = this.dateService.getSelectedYear();
    const savedMonth = this.dateService.getSelectedMonth();

    if (savedYear && savedMonth) {
      this.selectedYear = parseInt(savedYear);
      this.selectedMonth = parseInt(savedMonth) - 1;
      this.dateService.setDate(this.selectedYear, this.selectedMonth + 1);
    } else {
      this.selectedYear = defaultYear;
      this.selectedMonth = defaultMonth;
      this.dateService.setDate(defaultYear, defaultMonth + 1);
    }

    this.dateSubscription = this.dateService.selectedDate$.subscribe(({ year, month }) => {
      this.currentYear = year ?? '';
      this.currentMonth = month ?? '';
    });

    this.routeSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const path = event.urlAfterRedirects.split('/');
        this.currentRoute = this.mapRouteToTitle(path[path.length - 1]);
      }
    });

    this.loadNotifications();

    // Activar modo oscuro si estaba guardado
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
      this.isDarkMode = true;
      document.documentElement.classList.add('dark');
    }

    // 🚀 Notificaciones basadas en tareas reales
    this.checkTareasDelDia();
  }

  // Metodo para destruir el componente y limpiar las subscripciones
  ngOnDestroy(): void {
    this.dateSubscription?.unsubscribe();
    this.routeSubscription?.unsubscribe();
  }

  // Metodo para generar un rango de años
  generateYearRange(start: number, end: number): void {
    this.years = [];
    for (let year = start; year <= end; year++) {
      this.years.push(year);
    }
  }

  // Metodo para abrir el modal de selección de mes
  openMonthModal(): void {
    this.showMonthModal = true;
  }

  // Metodo para cerrar el modal de selección de mes
  closeMonthModal(): void {
    this.showMonthModal = false;
  }

  // Metodo para cerrar el modal de selección de año
  clearYearSelection(): void {
    this.selectedYear = null;
  }

  // Metodo para cerrar el modal de selección de mes
  selectYear(year: number): void {
    this.selectedYear = year;
  }

  // Metodo para cerrar el modal de selección de mes
  selectMonth(monthIndex: number): void {
    this.selectedMonth = monthIndex;
    this.showMonthModal = false;

    const mes = monthIndex + 1;
    this.dateService.setDate(this.selectedYear!, mes);
    console.log('Fecha seleccionada →', this.selectedYear, mes);

    // ✅ Notificar cambio de mes
    const user = this.authService.getUser();
    const uid = user?.id;

    if (uid) {
      const yearStr = this.selectedYear!.toString();
      const monthStr = mes.toString().padStart(2, '0');
      this.dateService.notifyMonthChange(uid, yearStr, monthStr);
    }
  }

  // Metodo para cerrar el modal de selección de mes
  mapRouteToTitle(route: string): string {
    switch (route) {
      case 'expense':
        return 'Gastos';
      case 'income':
        return 'Ingresos';
      case 'wallet':
        return 'Cartera';
      case 'saving':
        return 'Ahorros';
      case 'loan':
        return 'Préstamos';
      case 'debt':
        return 'Deudas';
      case 'home':
        return 'Inicio';
      default:
        return this.capitalize(route);
    }
  }

  // Metodo para capitalizar la primera letra de una cadena
  capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  // Metodo para cerrar el modal de selección de mes
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    const clickedInsideDropdown =
      this.notifDropdownRef?.nativeElement.contains(target);
    const clickedToggleButton = target.closest('[data-toggle-notif]');

    if (!clickedInsideDropdown && !clickedToggleButton) {
      this.showNotifications = false;
    }
  }

  // Metodo para Modo Oscuro y claro
  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;

    const htmlElement = document.documentElement;
    if (this.isDarkMode) {
      htmlElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      htmlElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }

  // ==================
  // Notificaciones
  // ==================

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  loadNotifications(): void {
    const user = this.authService.getUser();
    const uid = user?.id;
    if (!uid) return;

    this.authService.getUserNotifications(uid).subscribe((data) => {
      if (data) {
        this.notifications = Object.entries(data).map(([key, value]: any) => ({
          id: key,
          ...value,
        }));
        this.unreadCount = this.notifications.filter((n) => !n.leido).length;
      }
    });
  }

  markAsRead(notifId: string): void {
    const user = this.authService.getUser();
    const uid = user?.id;
    if (!uid) return;

    this.authService.markNotificationAsRead(uid, notifId).subscribe(() => {
      this.notifications = this.notifications.map((n) => {
        if (n.id === notifId) n.leido = true;
        return n;
      });
      this.unreadCount = this.notifications.filter((n) => !n.leido).length;
    });
  }


  logout(): void {
    this.authService.logout(); // asegúrate de que este método exista
    this.router.navigate(['/auth/login']); // o la ruta a tu pantalla de login
  }

  syncNotificacionesLocales(): void {
    this.notifications = this.notificacionService.getAll();
    this.unreadCount = this.notificacionService.getUnreadCount();
  }

  checkTareasDelDia(): void {
    this.taskService.getTodayTasks().subscribe((tareasHoy) => {
      const tareasPorTipo: { [tipo: string]: number } = {};

      tareasHoy.forEach((t) => {
        if (t.estado !== 'realizado') {
          const tipoKey = t.tipo || 'sin_clasificar';
          tareasPorTipo[tipoKey] = (tareasPorTipo[tipoKey] || 0) + 1;
        }
      });

      for (const tipoKey in tareasPorTipo) {
        const tipoLegible = this.formatearNombreTipo(tipoKey);
        this.notificacionService.add(`Tienes ${tareasPorTipo[tipoKey]} tareas pendientes hoy del tipo "${tipoLegible}".`);
      }

      // 🔁 Revisar tareas retrasadas (solo estado "no realizado")
      this.taskService.getAllTasks().subscribe((todas) => {
        const hoy = new Date();

        const atrasadas = todas.filter((t) => {
          if (!t.fecha || t.estado !== 'no realizado') return false;
          const fecha = new Date(t.fecha);
          return !isNaN(fecha.getTime()) && fecha < hoy && !this.mismoDia(fecha, hoy);
        });

        if (atrasadas.length > 0) {
          this.notificacionService.add(`Tienes ${atrasadas.length} tareas retrasadas sin completar.`);
        }

        this.syncNotificacionesLocales();
      });
    });
  }

  formatearNombreTipo(key: string): string {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase()); // capitalize each word
  }

  private mismoDia(d1: Date, d2: Date): boolean {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

}

function mismoDia(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}
