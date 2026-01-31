import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="not-found-container">
      <div class="not-found-content">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <a routerLink="/dashboard" class="back-btn">Go to Dashboard</a>
      </div>
    </div>
  `,
  styles: [`
    .not-found-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: var(--bg-dark);
      padding: 1rem;
    }
    
    .not-found-content {
      text-align: center;
      max-width: 400px;
    }
    
    h1 {
      font-size: 6rem;
      font-weight: 800;
      color: var(--primary);
      margin: 0;
      line-height: 1;
    }
    
    h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 1rem 0 0.5rem;
    }
    
    p {
      color: var(--text-secondary);
      margin-bottom: 2rem;
    }
    
    .back-btn {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background: var(--primary);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      transition: all 0.2s;
    }
    
    .back-btn:hover {
      background: var(--primary-dark);
      transform: translateY(-2px);
    }
  `]
})
export class NotFoundComponent {}
