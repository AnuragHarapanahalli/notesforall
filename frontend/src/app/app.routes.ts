import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { SubjectDetailComponent } from './components/subject-detail/subject-detail.component';
import { FileViewerComponent } from './components/file-viewer/file-viewer.component';
import { AdminLoginComponent } from './components/admin/login/admin-login.component';
import { AdminDashboardComponent } from './components/admin/dashboard/admin-dashboard.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'subject/:id', component: SubjectDetailComponent },
  { path: 'view/:fileId', component: FileViewerComponent },
  { path: 'admin/login', component: AdminLoginComponent },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];