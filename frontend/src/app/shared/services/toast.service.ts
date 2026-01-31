import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts: Toast[] = [];
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  private idCounter = 0;

  get toasts$(): Observable<Toast[]> {
    return this.toastsSubject.asObservable();
  }

  success(message: string, duration: number = 3000): void {
    this.show({ type: 'success', message, duration });
  }

  error(message: string, duration: number = 4000): void {
    this.show({ type: 'error', message, duration });
  }

  warning(message: string, duration: number = 3500): void {
    this.show({ type: 'warning', message, duration });
  }

  info(message: string, duration: number = 3000): void {
    this.show({ type: 'info', message, duration });
  }

  private show(toast: Omit<Toast, 'id'>): void {
    const id = ++this.idCounter;
    const newToast: Toast = { ...toast, id };
    
    this.toasts = [...this.toasts, newToast];
    this.toastsSubject.next(this.toasts);

    if (toast.duration && toast.duration > 0) {
      setTimeout(() => this.remove(id), toast.duration);
    }
  }

  remove(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.toastsSubject.next(this.toasts);
  }

  clear(): void {
    this.toasts = [];
    this.toastsSubject.next(this.toasts);
  }
}
