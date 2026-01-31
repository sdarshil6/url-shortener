import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
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
export class ModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() iconClass = '';
  @Input() icon = '';
  @Output() closeModal = new EventEmitter<void>();

  iconSvg: SafeHtml = '';

  constructor(private iconService: IconService) {}

  ngOnInit(): void {
    if (this.icon) {
      this.iconSvg = this.iconService.getIconSVG(this.icon, 30, 30);
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
