import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { IconService } from '../../services/icon.service';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss'
})
export class AuthLayoutComponent implements OnChanges {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() icon: string = '';
  @Input() featureText: string = '';

  iconSvg: SafeHtml | null = null;

  constructor(private iconService: IconService) {}

  ngOnChanges(): void {
    if (this.icon) {
      // Remove 'lucide-' prefix if present
      const iconName = this.icon.replace('lucide-', '');
      this.iconSvg = this.iconService.getIconSVG(iconName, 28, 28);
    }
  }
}
