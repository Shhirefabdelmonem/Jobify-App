import { Component } from '@angular/core';
import { NavSidebarComponent } from '../nav-sidebar/nav-sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-test-profile',
  standalone: true,
  imports: [NavSidebarComponent, HeaderComponent, CommonModule, FormsModule],
  templateUrl: './test-profile.component.html',
  styleUrl: './test-profile.component.css'
})
export class TestProfileComponent {
  isPanelOpen = false;
  currentEditSection = '';
  isSidebarOpen = false;
  
  // User profile data
  profileData = {
    personal: {
      firstName: 'Shiref',
      lastName: 'Abdelmonem',
      email: 'shirefelageiry@gmail.com',
      phone: '+1-008-127-665',
      location: '2th Distinct, 6th of October, Giza, Egypt',
      postalCode: ''
    },
    social: {
      linkedin: 'www.linkedin.com/in/shiref-abdelmonem-793150232',
      github: 'Leetcode: shiref12'
    },
    education: [
      {
        startDate: '2021-09',
        endDate: '2025-06',
        institution: 'Misr University For Science and Technology',
        degree: 'Bachelor\'s Degree in Computer Science',
        gpa: '3.8'
      }
    ],
    workExperience: [
      {
        startDate: '2024-05',
        endDate: '2024-09',
        company: '',
        position: '',
        description: ''
      }
    ],
    skills: []
  };
  
  // Copy of data for editing
  editData: any = {};
  
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    // Prevent body scrolling when sidebar is open on mobile
    if (this.isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
  
  openEditPanel(section: string) {
    this.currentEditSection = section;
    // Create a deep copy of the data for editing
    this.editData = JSON.parse(JSON.stringify(this.profileData[section as keyof typeof this.profileData]));
    this.isPanelOpen = true;
  }
  
  closeEditPanel() {
    this.isPanelOpen = false;
  }
  
  updateProfile() {
    // Update the profile data with edited values
    this.profileData[this.currentEditSection as keyof typeof this.profileData] = 
      JSON.parse(JSON.stringify(this.editData));
    this.closeEditPanel();
  }
}
