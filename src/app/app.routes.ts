import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard'; // 👈 Importa tu guard
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.component')
  },
  {
    path: 'app',
    canActivate: [AuthGuard], // ✅ Aquí aplicas el guard a TODA la sección protegida
    loadComponent: () => import('./shared/components/layout/layout.component'),
    children: [
      { path: 'home', loadComponent: () => import('./pages/home/home.component') },
      { path: 'category/:name', loadComponent: () => import('./pages/category/category.component').then(m => m.CategoryComponent) },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
