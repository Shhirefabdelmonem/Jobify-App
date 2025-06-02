import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavSidebarComponent } from '../nav-sidebar/nav-sidebar.component';
import { HeaderComponent } from '../header/header.component';

export type ApplicationStatus =
  | 'Applied'
  | 'Get Assessment'
  | 'Interviewing'
  | 'Offer Received'
  | 'Rejected'
  | 'Archived';

export interface TrackedApplication {
  id: string;
  jobTitle: string;
  company: string;
  status: ApplicationStatus;
  appliedDate: Date;
  jobLink?: string;
  skillsRequired?: string;
  combinedMatchScore?: string;
  semanticScore?: string;
  keywordScore?: string;
  location?: string;
  jobType?: string;
  salaryRange?: string;
}

@Component({
  selector: 'app-track-applications',
  imports: [CommonModule, NavSidebarComponent, HeaderComponent],
  templateUrl: './track-applications.component.html',
  styleUrl: './track-applications.component.css',
})
export class TrackApplicationsComponent implements OnInit {
  // Available application statuses
  applicationStatuses: ApplicationStatus[] = [
    'Applied',
    'Get Assessment',
    'Interviewing',
    'Offer Received',
    'Rejected',
    'Archived',
  ];

  // Currently selected tab
  selectedStatus: ApplicationStatus = 'Applied';

  // All tracked applications
  trackedApplications: TrackedApplication[] = [];

  // Filtered applications based on selected status
  filteredApplications: TrackedApplication[] = [];

  // Loading state
  isLoading: boolean = true;

  constructor() {}

  ngOnInit(): void {
    this.loadTrackedApplications();
  }

  /**
   * Load tracked applications from localStorage and any other sources
   */
  loadTrackedApplications(): void {
    this.isLoading = true;

    // Load from localStorage (from the apply popup modal)
    const storedApplications = this.loadFromLocalStorage();

    // Load from track applications data (saved by recommendations component)
    const trackApplicationsData = this.loadFromTrackApplicationsData();

    // Add some mock data for demonstration
    const mockApplications = this.getMockApplications();

    // Combine all applications (remove duplicates)
    const allApplications = [
      ...storedApplications,
      ...trackApplicationsData,
      ...mockApplications,
    ];
    this.trackedApplications =
      this.removeDuplicateApplications(allApplications);

    // Filter applications for the selected status
    this.filterApplicationsByStatus();

    this.isLoading = false;
  }

  /**
   * Load applications from localStorage (from apply popup modal)
   */
  private loadFromLocalStorage(): TrackedApplication[] {
    try {
      const stored = localStorage.getItem('jobApplicationHistory');
      if (stored) {
        const history = JSON.parse(stored);
        return history
          .filter((item: any) => item.applied === true) // Only show applications where user said "Yes"
          .map((item: any) => ({
            id: `${item.jobTitle}-${item.company}`
              .replace(/\s+/g, '-')
              .toLowerCase(),
            jobTitle: item.jobTitle,
            company: item.company,
            status: 'Applied' as ApplicationStatus,
            appliedDate: new Date(item.timestamp),
            combinedMatchScore: '85%', // Default score for tracked applications
            skillsRequired: 'JavaScript; TypeScript; Angular; Node.js',
            location: 'Remote',
            jobType: 'Full-time',
            salaryRange: 'Competitive',
          }));
      }
      return [];
    } catch (error) {
      console.error('Error loading applications from localStorage:', error);
      return [];
    }
  }

  /**
   * Load applications from track applications data (saved by recommendations component)
   */
  private loadFromTrackApplicationsData(): TrackedApplication[] {
    try {
      const stored = localStorage.getItem('trackApplicationsData');
      if (stored) {
        const data = JSON.parse(stored);
        return data.map((item: any) => ({
          id: item.id,
          jobTitle: item.jobTitle,
          company: item.company,
          status: item.status as ApplicationStatus,
          appliedDate: new Date(item.appliedDate),
          combinedMatchScore: item.combinedMatchScore || '85%',
          skillsRequired:
            item.skillsRequired || 'JavaScript; TypeScript; Angular; Node.js',
          location: item.location || 'Remote',
          jobType: item.jobType || 'Full-time',
          salaryRange: item.salaryRange || 'Competitive',
          jobLink: item.jobLink,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error loading track applications data:', error);
      return [];
    }
  }

  /**
   * Remove duplicate applications based on job title and company
   */
  private removeDuplicateApplications(
    applications: TrackedApplication[]
  ): TrackedApplication[] {
    const seen = new Set<string>();
    return applications.filter((app) => {
      const key = `${app.jobTitle}-${app.company}`.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Get mock applications for demonstration
   */
  private getMockApplications(): TrackedApplication[] {
    return [
      {
        id: 'backend-developer-oracle',
        jobTitle: 'Back end developer',
        company: 'Oracle / Data Governance · Data Management · Public Company',
        status: 'Applied',
        appliedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        combinedMatchScore: '93%',
        skillsRequired: 'Java; Spring Boot; MySQL; REST APIs; Microservices',
        location: 'USA',
        jobType: 'Full-Time',
        salaryRange: '$80K - $120K',
      },
      {
        id: 'frontend-engineer-lensa',
        jobTitle: 'Frontend Engineer (India)',
        company: 'Lensa / Gaming · Human Resources · Growth Stage',
        status: 'Interviewing',
        appliedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        combinedMatchScore: '89%',
        skillsRequired: 'React; TypeScript; CSS; HTML; JavaScript',
        location: 'United States',
        jobType: 'Full-time',
        salaryRange: '$70K - $100K',
      },
      {
        id: 'software-engineer-brellium',
        jobTitle: 'Software Engineer',
        company: 'Brellium / Billing · Enterprise Software · Early Stage',
        status: 'Applied',
        appliedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        combinedMatchScore: '89%',
        skillsRequired: 'Python; Django; PostgreSQL; AWS; Docker',
        location: 'New York, NY',
        jobType: 'Full-time',
        salaryRange: '$110K/yr - $130K/yr',
      },
    ];
  }

  /**
   * Switch to a different status tab
   */
  selectStatus(status: ApplicationStatus): void {
    this.selectedStatus = status;
    this.filterApplicationsByStatus();
  }

  /**
   * Filter applications based on selected status
   */
  private filterApplicationsByStatus(): void {
    this.filteredApplications = this.trackedApplications.filter(
      (app) => app.status === this.selectedStatus
    );
  }

  /**
   * Get count of applications for a specific status
   */
  getStatusCount(status: ApplicationStatus): number {
    return this.trackedApplications.filter((app) => app.status === status)
      .length;
  }

  /**
   * Update application status and save to localStorage
   */
  updateApplicationStatus(
    applicationId: string,
    newStatus: ApplicationStatus
  ): void {
    // Find and update the application
    const application = this.trackedApplications.find(
      (app) => app.id === applicationId
    );
    if (application) {
      const oldStatus = application.status;
      application.status = newStatus;

      // Save to localStorage
      this.saveToLocalStorage();

      // Re-filter applications for current view
      this.filterApplicationsByStatus();

      // Show success message (you can implement toast notifications here)
      console.log(
        `Application status updated from "${oldStatus}" to "${newStatus}"`
      );

      // Optional: Send to backend API
      // this.sendStatusUpdateToBackend(applicationId, newStatus);
    }
  }

  /**
   * Save tracked applications to localStorage
   */
  private saveToLocalStorage(): void {
    try {
      localStorage.setItem(
        'trackApplicationsData',
        JSON.stringify(this.trackedApplications)
      );
    } catch (error) {
      console.error('Error saving applications to localStorage:', error);
    }
  }

  /**
   * Optional: Send status update to backend API
   */
  private sendStatusUpdateToBackend(
    applicationId: string,
    newStatus: ApplicationStatus
  ): void {
    // Implement API call to update application status on the backend
    // Example:
    // this.applicationService.updateApplicationStatus(applicationId, newStatus).subscribe({
    //   next: (response) => console.log('Status updated on backend'),
    //   error: (error) => console.error('Failed to update status on backend', error)
    // });
  }

  /**
   * Helper methods for job card display (reused from recommendations component)
   */
  getMatchPercentage(combinedMatchScore: string): number {
    return parseFloat(combinedMatchScore.replace('%', ''));
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }

  getCompanyInitials(companyName: string): string {
    // Extract just the company name (before any slashes or additional info)
    const cleanName = companyName.split('/')[0].trim();
    return cleanName
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  getSkillsArray(skillsString: string): string[] {
    if (!skillsString) return [];
    return skillsString
      .split(';')
      .map((skill) => skill.trim())
      .filter((skill) => skill.length > 0)
      .slice(0, 5);
  }

  getMatchLabel(combinedMatchScore: string): string {
    const percentage = this.getMatchPercentage(combinedMatchScore);

    if (percentage >= 90) return 'EXCELLENT MATCH';
    if (percentage >= 80) return 'STRONG MATCH';
    if (percentage >= 70) return 'GOOD MATCH';
    return 'POTENTIAL MATCH';
  }

  getAIRecommendation(combinedMatchScore: string): string {
    const percentage = this.getMatchPercentage(combinedMatchScore);

    if (percentage >= 90) return 'Perfect fit! Great choice.';
    if (percentage >= 80) return 'Excellent opportunity!';
    if (percentage >= 70) return 'Good potential match.';
    return 'Consider your options.';
  }

  /**
   * Get status-specific styling classes
   */
  getStatusClass(status: ApplicationStatus): string {
    switch (status) {
      case 'Applied':
        return 'status-applied';
      case 'Get Assessment':
        return 'status-assessment';
      case 'Interviewing':
        return 'status-interviewing';
      case 'Offer Received':
        return 'status-offer';
      case 'Rejected':
        return 'status-rejected';
      case 'Archived':
        return 'status-archived';
      default:
        return 'status-default';
    }
  }
}
