import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton" [class]="'skeleton-' + type" [ngStyle]="customStyle">
      <div class="skeleton-shimmer"></div>
    </div>
  `,
  styles: [`
    .skeleton {
      position: relative;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 6px;
    }

    .skeleton-shimmer {
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.1) 50%,
        transparent 100%
      );
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% { left: -100%; }
      100% { left: 100%; }
    }

    .skeleton-text {
      height: 16px;
      margin-bottom: 8px;
    }

    .skeleton-card {
      height: 120px;
      margin-bottom: 12px;
    }

    .skeleton-circle {
      border-radius: 50%;
      width: 40px;
      height: 40px;
    }

    .skeleton-button {
      height: 40px;
    }
  `]
})
export class SkeletonLoaderComponent {
  @Input() type: 'text' | 'card' | 'circle' | 'button' = 'text';
  @Input() width?: string;
  @Input() height?: string;

  get customStyle() {
    const style: any = {};
    if (this.width) style.width = this.width;
    if (this.height) style.height = this.height;
    return style;
  }
}
