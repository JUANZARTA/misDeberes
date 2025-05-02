import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DateService } from '../../../services/date.service';
import { Subscription } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy {
  showMonthModal = false;
  years: number[] = [];
  months: string[] = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  selectedYear: number | null = null;
  selectedMonth: number | null = null;

  currentYear: string = '';
  currentMonth: string = '';
  currentRoute: string = '';

  userName: string = ''; // Para mostrar nombre si luego se quiere

  notifications: any[] = [];
  unreadCount: number = 0;
  showNotifications: boolean = false;

  private dateSubscription?: Subscription;
  private routeSubscription?: Subscription;
  private authService = inject(AuthService);

  constructor(private dateService: DateService, private router: Router) {}

  ngOnInit(): void {
    this.generateYearRange(2025, 2050);

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

    this.routeSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const path = event.urlAfterRedirects.split('/');
        this.currentRoute = this.mapRouteToTitle(path[path.length - 1]);
      }
    });

    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.dateSubscription?.unsubscribe();
    this.routeSubscription?.unsubscribe();
  }

  generateYearRange(start: number, end: number): void {
    this.years = [];
    for (let year = start; year <= end; year++) {
      this.years.push(year);
    }
  }

  openMonthModal(): void {
    this.showMonthModal = true;
  }

  closeMonthModal(): void {
    this.showMonthModal = false;
  }

  clearYearSelection(): void {
    this.selectedYear = null;
  }

  selectYear(year: number): void {
    this.selectedYear = year;
  }

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


  mapRouteToTitle(route: string): string {
    switch (route) {
      case 'expense': return 'Gastos';
      case 'income': return 'Ingresos';
      case 'wallet': return 'Cartera';
      case 'saving': return 'Ahorros';
      case 'loan': return 'Préstamos';
      case 'debt': return 'Deudas';
      case 'home': return 'Inicio';
      default: return this.capitalize(route);
    }
  }

  capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  // 📩 NOTIFICACIONES

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
          ...value
        }));
        this.unreadCount = this.notifications.filter(n => !n.leido).length;
      }
    });
  }

  markAsRead(notifId: string): void {
    const user = this.authService.getUser();
    const uid = user?.id;
    if (!uid) return;

    this.authService.markNotificationAsRead(uid, notifId).subscribe(() => {
      this.notifications = this.notifications.map(n => {
        if (n.id === notifId) n.leido = true;
        return n;
      });
      this.unreadCount = this.notifications.filter(n => !n.leido).length;
    });
  }
}
