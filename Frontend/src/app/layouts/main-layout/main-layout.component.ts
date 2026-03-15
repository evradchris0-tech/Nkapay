import { Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PhoneFormatPipe } from '../../core/pipes/phone-format.pipe';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, PhoneFormatPipe],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  sidebarCollapsed = signal(false);
  currentUser = this.authService.currentUser;
  
  menuItems: MenuItem[] = [
    { label: 'Tableau de bord', icon: 'dashboard', route: '/dashboard' },
    { label: 'Tontines', icon: 'account_balance', route: '/dashboard/tontines' },
    { label: 'Découvrir', icon: 'explore', route: '/dashboard/tontines/recherche' },
    { label: 'Exercices', icon: 'calendar_month', route: '/dashboard/exercices' },
    { label: 'Réunions', icon: 'groups', route: '/dashboard/reunions' },
    { label: 'Membres', icon: 'people', route: '/dashboard/membres' },
    { label: 'Transactions', icon: 'payments', route: '/dashboard/transactions' },
    { label: 'Prêts', icon: 'credit_score', route: '/dashboard/prets' },
    { label: 'Pénalités', icon: 'gavel', route: '/dashboard/penalites' },
    { label: 'Distributions', icon: 'savings', route: '/dashboard/distributions' },
    { label: 'Secours', icon: 'volunteer_activism', route: '/dashboard/secours' },
    { label: 'Rapports', icon: 'assessment', route: '/dashboard/rapports' }
  ];

  adminMenuItems: MenuItem[] = [
    { label: 'Utilisateurs', icon: 'manage_accounts', route: '/dashboard/admin' },
    { label: 'Organisations', icon: 'corporate_fare', route: '/dashboard/admin/organisations' }
  ];

  isSuperAdmin = computed(() => {
    const user = this.currentUser();
    return user?.estSuperAdmin === true;
  });

  userInitials = computed(() => {
    const user = this.currentUser();
    if (!user) return '?';
    const first = user.nom?.charAt(0) || '';
    const last = user.prenom?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  });

  toggleSidebar() {
    this.sidebarCollapsed.update(v => !v);
  }

  logout() {
    this.authService.logout();
    this.notificationService.success('Déconnexion', 'À bientôt!');
    this.router.navigate(['/auth/login']);
  }
}
