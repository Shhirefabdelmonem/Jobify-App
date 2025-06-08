import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavSidebarComponent } from '../nav-sidebar/nav-sidebar.component';
import { HeaderComponent } from '../header/header.component';
import {
  TrackApplicationsService,
  JobApplicationDto as BackendJobApplicationDto,
  ApplicationStatus,
  UpdateJobApplicationCommand,
} from '../../services/track-applications.service';

// Frontend interface that extends backend DTO with additional properties
interface JobApplicationDto extends BackendJobApplicationDto {
  appliedDate: Date; // Mapped from updateDate
  location?: string; // Optional property for display
  jobType?: string; // Optional property for display
  salaryRange?: string; // Optional property for display
}

@Component({
  selector: 'app-track-applications',
  imports: [CommonModule, FormsModule, NavSidebarComponent, HeaderComponent],
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

  // All tracked applications from backend
  trackedApplications: JobApplicationDto[] = [];

  // Filtered applications based on selected status
  filteredApplications: JobApplicationDto[] = [];

  // Loading state
  isLoading: boolean = true;

  // Error state
  error: string | null = null;

  constructor(private trackApplicationsService: TrackApplicationsService) {}

  ngOnInit(): void {
    this.loadTrackedApplications();
  }

  /**
   * Load tracked applications from backend API
   */
  loadTrackedApplications(): void {
    this.isLoading = true;
    this.error = null;

    this.trackApplicationsService.getAllJobApplications().subscribe({
      next: (response) => {
        if (
          response.success &&
          response.data &&
          response.data.jobApplications
        ) {
          this.trackedApplications = response.data.jobApplications.map(
            (app): JobApplicationDto => ({
              ...app,
              appliedDate: new Date(app.updateDate), // Map updateDate to appliedDate for display
              location: 'Remote', // Default value since not provided by backend
              jobType: 'Full-time', // Default value since not provided by backend
              salaryRange: 'Competitive', // Default value since not provided by backend
            })
          );
          this.filterApplicationsByStatus();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching tracked applications:', error);
        this.error =
          'Failed to load tracked applications. Please try again later.';
        this.isLoading = false;
      },
    });
  }

  /**
   * Switch to a different status tab
   */
  selectStatus(status: ApplicationStatus): void {
    this.selectedStatus = status;
    this.filterApplicationsByStatus();
  }

  /**
   * Safely cast status string to ApplicationStatus type
   */
  private castToApplicationStatus(status: string): ApplicationStatus {
    return status as ApplicationStatus;
  }

  /**
   * Filter applications based on selected status
   */
  private filterApplicationsByStatus(): void {
    this.filteredApplications = this.trackedApplications.filter(
      (app) => this.castToApplicationStatus(app.status) === this.selectedStatus
    );
  }

  /**
   * Get count of applications for a specific status
   */
  getStatusCount(status: ApplicationStatus | string): number {
    return this.trackedApplications.filter((app) => app.status === status)
      .length;
  }

  /**
   * Handle status change from dropdown
   */
  onStatusChange(application: JobApplicationDto, event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newStatus = target.value;

    console.log(
      `Dropdown changed: ${application.status} -> ${newStatus} for application ${application.jobApplicationId}`
    );

    if (newStatus && newStatus !== application.status) {
      this.updateApplicationStatus(application, newStatus);
    } else if (newStatus === application.status) {
      console.log('Status unchanged, no update needed');
    }
  }

  /**
   * Update application status via backend API
   */
  updateApplicationStatus(
    application: JobApplicationDto,
    newStatus: string
  ): void {
    // Prevent update if status is the same
    if (application.status === newStatus) {
      return;
    }

    console.log(
      `Updating application ${application.jobApplicationId} from "${application.status}" to "${newStatus}"`
    );

    const updateCommand: UpdateJobApplicationCommand = {
      jobTitle: application.jobTitle,
      company: application.company,
      skillsRequired: application.skillsRequired,
      combinedMatchScore: application.combinedMatchScore,
      jobLink: application.jobLink,
      status: newStatus as ApplicationStatus,
    };

    // Store the old status for potential rollback
    const oldStatus = application.status;
    const oldSelectedStatus = this.selectedStatus;

    // Optimistically update the UI
    application.status = newStatus;

    // Smart tab switching: if the new status is different from current tab,
    // switch to the new status tab to show the user where their application went
    const shouldSwitchTab = newStatus !== this.selectedStatus;
    if (shouldSwitchTab) {
      this.selectedStatus = newStatus as ApplicationStatus;
    }

    // Re-filter applications to reflect the change
    this.filterApplicationsByStatus();

    // Send update to backend
    this.trackApplicationsService
      .updateJobApplication(application.jobApplicationId, updateCommand)
      .subscribe({
        next: (response) => {
          if (response.success) {
            console.log(
              `Application status successfully updated from "${oldStatus}" to "${newStatus}"`
            );

            if (shouldSwitchTab) {
              console.log(
                `Switched to ${newStatus} tab to show updated application`
              );
            }

            // Update the application's updateDate to current date
            application.appliedDate = new Date();
          } else {
            console.error('Backend returned unsuccessful response:', response);
            this.handleUpdateError(
              application,
              oldStatus,
              oldSelectedStatus,
              'Update failed: ' + response.message
            );
          }
        },
        error: (error) => {
          console.error('Failed to update application status:', error);
          this.handleUpdateError(
            application,
            oldStatus,
            oldSelectedStatus,
            'Failed to update status. Please try again.'
          );
        },
      });
  }

  /**
   * Handle update errors by reverting changes and showing error message
   */
  private handleUpdateError(
    application: JobApplicationDto,
    oldStatus: string,
    oldSelectedStatus: ApplicationStatus,
    errorMessage: string
  ): void {
    // Revert the optimistic update
    application.status = oldStatus;
    this.selectedStatus = oldSelectedStatus;
    this.filterApplicationsByStatus();

    // Log error message
    console.error(errorMessage);
  }

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
  getStatusClass(status: string): string {
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

  /**
   * Refresh the applications data
   */
  refreshApplications(): void {
    this.loadTrackedApplications();
  }

  /**
   * Open job link in new tab
   */
  openJobLink(jobLink: string): void {
    window.open(jobLink, '_blank', 'noopener,noreferrer');
  }

  /**
   * Force refresh of change detection (for debugging purposes)
   */
  forceRefresh(): void {
    // Trigger change detection by creating new array references
    this.trackedApplications = [...this.trackedApplications];
    this.filterApplicationsByStatus();
  }
}
