import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../layouts/navbar/navbar.component';
import { FooterComponent } from '../../layouts/footer/footer.component';
import { CreateLinkComponent } from './components/create-link/create-link.component';
import { LinkListComponent } from './components/link-list/link-list.component';
import { BulkUploadComponent } from './components/bulk-upload/bulk-upload.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    FooterComponent,
    CreateLinkComponent,
    LinkListComponent,
    BulkUploadComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  activeTab: 'single' | 'bulk' = 'single';

  ngOnInit() {
    // Component initialization
  }

  switchTab(tab: 'single' | 'bulk') {
    if (this.activeTab === tab) {
      return;
    }
    this.activeTab = tab;
  }
}
