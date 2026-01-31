import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {
  username = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((user: string | null) => {
      this.username = user || '';
    });
  }

  logout() {
    this.authService.logout();
    this.toastService.info('You have been signed out. See you again soon!');
    this.router.navigate(['/auth/login']);
  }
}
