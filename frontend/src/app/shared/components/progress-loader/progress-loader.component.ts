import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-loader.component.html',
  styleUrl: './progress-loader.component.scss'
})
export class ProgressLoaderComponent {
  @Input() progress: number = 0;
  @Input() showPercentage: boolean = true;
  @Input() height: string = '8px';
  @Input() backgroundColor: string = '#e0e0e0';
  @Input() progressColor: string = '#4f46e5';
  @Input() animationDuration: string = '0.3s';

  get progressPercentage(): number {
    return Math.min(100, Math.max(0, this.progress));
  }
}
