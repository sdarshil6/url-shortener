import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconService } from '../../services/icon.service';
import { SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() iconClass = '';
  @Input() icon = '';
  @Output() closeModal = new EventEmitter<void>();

  iconSvg: SafeHtml = '';
  private previousActiveElement: HTMLElement | null = null;
  private focusableElements: HTMLElement[] = [];

  constructor(private iconService: IconService, private elementRef: ElementRef) {}

  ngOnInit(): void {
    if (this.icon) {
      this.iconSvg = this.iconService.getIconSVG(this.icon, 30, 30);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (this.isOpen) {
        this.onModalOpen();
      } else {
        this.onModalClose();
      }
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: Event): void {
    if (this.isOpen && event instanceof KeyboardEvent) {
      event.preventDefault();
      this.close();
    }
  }

  private onModalOpen(): void {
    // Store currently focused element
    this.previousActiveElement = document.activeElement as HTMLElement;
    
    // Wait for modal to render, then set up focus trap
    setTimeout(() => {
      this.setupFocusTrap();
      this.focusFirstElement();
    }, 0);
  }

  private onModalClose(): void {
    // Restore focus to previous element
    if (this.previousActiveElement) {
      this.previousActiveElement.focus();
      this.previousActiveElement = null;
    }
  }

  private setupFocusTrap(): void {
    const modalElement = this.elementRef.nativeElement.querySelector('.modal-content');
    if (!modalElement) return;

    // Get all focusable elements
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];
    
    this.focusableElements = Array.from(
      modalElement.querySelectorAll(focusableSelectors.join(','))
    ) as HTMLElement[];
  }

  private focusFirstElement(): void {
    if (this.focusableElements.length > 0) {
      this.focusableElements[0].focus();
    }
  }

  @HostListener('document:keydown.tab', ['$event'])
  handleTabKey(event: Event): void {
    if (!this.isOpen || this.focusableElements.length === 0 || !(event instanceof KeyboardEvent)) return;

    const firstElement = this.focusableElements[0];
    const lastElement = this.focusableElements[this.focusableElements.length - 1];
    const activeElement = document.activeElement as HTMLElement;

    // If shift+tab on first element, move to last
    if (event.shiftKey && activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    }
    // If tab on last element, move to first
    else if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  close(): void {
    this.closeModal.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.close();
    }
  }
}
