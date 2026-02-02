import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { ToastService, Toast } from '../../services/toast.service';
import { TOAST_ICONS } from '../../constants/app.constants';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent implements OnInit {
  toasts$: Observable<Toast[]>;

  constructor(private toastService: ToastService) {
    this.toasts$ = this.toastService.toasts$;
  }

  ngOnInit(): void {}

  removeToast(id: number): void {
    this.toastService.remove(id);
  }

  getIconUrl(type: string): string {
    const icons: Record<string, string> = {
      success: TOAST_ICONS.success,
      error: TOAST_ICONS.error,
      warning: TOAST_ICONS.warning,
      info: 'assets/icons/info.svg'
    };
    return icons[type] || icons['info'];
  }
}
