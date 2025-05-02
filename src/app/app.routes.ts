import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

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
    canActivate: [AuthGuard],
    loadComponent: () => import('./shared/components/layout/layout.component'),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'category/:name',
        loadComponent: () => import('./pages/category/category.component').then(m => m.CategoryComponent)
      },
      {
        path: 'tasks',
        loadComponent: () => import('./pages/tasks/tasks.component').then(m => m.TasksComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
