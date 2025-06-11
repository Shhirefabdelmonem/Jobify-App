import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavSidebarComponent } from '../nav-sidebar/nav-sidebar.component';
import { HeaderComponent } from '../header/header.component';
import {
  ApplyPopUpComponent,
  ApplicationTrackingData,
} from '../apply-pop-up/apply-pop-up.component';
import {
  RecommendationsService,
  Job,
} from '../../services/recommendations.service';
import {
  TrackApplicationsService,
  UpdateJobApplicationCommand,
  ApplicationStatus,
  AddJobApplicationCommand,
  AddJobApplicationResponse,
} from '../../services/track-applications.service';

@Component({
  selector: 'app-recommendations',
  imports: [
    NavSidebarComponent,
    HeaderComponent,
    CommonModule,
    ApplyPopUpComponent,
  ],
  templateUrl: './recommendations.component.html',
  styleUrl: './recommendations.component.css',
})
export class RecommendationsComponent implements OnInit {
  recommendedJobs: Job[] = [];
  isLoading: boolean = true;
  error: string | null = null;

  // Modal state management
  showApplyModal: boolean = false;
  selectedJob: Job | null = null;

  // Application tracking
  applicationHistory: ApplicationTrackingData[] = [];

  // Toast notification state
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';

  constructor(
    private recommendationsService: RecommendationsService,
    private trackApplicationsService: TrackApplicationsService
  ) {}

  ngOnInit(): void {
    this.fetchRecommendedJobs();
    this.loadExistingApplications();
  }

  fetchRecommendedJobs(): void {
    this.isLoading = true;
    this.error = null;

    this.recommendationsService.getRecommendedJobs().subscribe({
      next: (response) => {
        if (response.statusCode === 200 && response.data) {
          this.recommendedJobs = response.data.recommended_jobs;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching recommended jobs:', error);
        this.error = 'Failed to load recommended jobs. Please try again later.';
        this.isLoading = false;
      },
    });
  }

  /**
   * Load existing job applications from database to restore applied status
   */
  private loadExistingApplications(): void {
    this.trackApplicationsService.getAllJobApplications().subscribe({
      next: (response) => {
        if (
          response.success &&
          response.data &&
          response.data.jobApplications
        ) {
          // Convert existing applications to ApplicationTrackingData format
          this.applicationHistory = response.data.jobApplications.map(
            (app) => ({
              jobTitle: app.jobTitle,
              company: app.company,
              applied: true, // All entries in database are applied
              timestamp: new Date(app.updateDate), // Convert to Date object
              jobId: `${app.jobTitle}-${app.company}`,
            })
          );

          console.log(
            `Loaded ${this.applicationHistory.length} existing applications from database`
          );
        }
      },
      error: (error) => {
        console.error('Error loading existing applications:', error);
        // Don't show error to user as this is background loading
        // The component will still work, just won't show applied status for existing apps
      },
    });
  }

  // Handle apply button click - open external link and show modal after delay
  onApplyClick(job: Job, event: Event): void {
    event.preventDefault();

    // Store the selected job for the modal
    this.selectedJob = job;

    // Open the external job link in a new tab
    if (job.job_link) {
      window.open(job.job_link, '_blank', 'noopener,noreferrer');
    }

    // Show the modal after a short delay to allow the external page to load
    setTimeout(() => {
      this.showApplyModal = true;
    }, 2000); // 2 second delay
  }

  // Handle application tracking response
  onApplicationTracked(trackingData: ApplicationTrackingData): void {
    // Check if this application already exists in history
    const existingIndex = this.applicationHistory.findIndex(
      (app) =>
        app.jobTitle === trackingData.jobTitle &&
        app.company === trackingData.company
    );

    if (existingIndex > -1) {
      // Update existing entry
      this.applicationHistory[existingIndex] = trackingData;
    } else {
      // Add new entry to application history for local tracking
      this.applicationHistory.push(trackingData);
    }

    // Log for debugging
    console.log('Application tracked:', trackingData);

    // If user applied, add the job application to the database
    if (trackingData.applied && this.selectedJob) {
      this.addJobApplicationToDatabase(trackingData);
    }

    // Show success message
    this.showSuccessMessage(trackingData);
  }

  // Add job application to database
  private addJobApplicationToDatabase(
    trackingData: ApplicationTrackingData
  ): void {
    if (!this.selectedJob) {
      console.error('No selected job found');
      return;
    }

    const addCommand: AddJobApplicationCommand = {
      jobTitle: trackingData.jobTitle,
      company: trackingData.company,
      skillsRequired: this.selectedJob.skills_required,
      combinedMatchScore: this.selectedJob.combined_match_score,
      jobLink: this.selectedJob.job_link,
      status: 'Applied', // Default status
      updateDate: new Date(),
    };

    this.trackApplicationsService.addJobApplication(addCommand).subscribe({
      next: (response: AddJobApplicationResponse) => {
        if (response.success) {
          console.log('Job application added successfully:', response.message);
          // Show success toast notification
          this.showSuccessToast(
            `Application for ${trackingData.jobTitle} has been added to your tracking list!`
          );
        } else {
          console.error('Failed to add job application:', response.message);
          this.showErrorToast(
            'Failed to add application to tracking list. Please try again.'
          );
        }
      },
      error: (error) => {
        console.error('Error adding job application:', error);
        this.showErrorToast(
          'An error occurred while adding the application. Please try again.'
        );

        // Remove from local history since database operation failed
        const index = this.applicationHistory.findIndex(
          (app) =>
            app.jobTitle.toLowerCase().trim() ===
              trackingData.jobTitle.toLowerCase().trim() &&
            app.company.toLowerCase().trim() ===
              trackingData.company.toLowerCase().trim() &&
            app.timestamp === trackingData.timestamp
        );
        if (index > -1) {
          this.applicationHistory.splice(index, 1);
        }
      },
    });
  }

  // Handle modal close
  onModalClosed(): void {
    this.showApplyModal = false;
    this.selectedJob = null;
  }

  // Show success message (you can customize this based on your UI needs)
  private showSuccessMessage(trackingData: ApplicationTrackingData): void {
    const message = trackingData.applied
      ? `Great! We've recorded your application for ${trackingData.jobTitle}. Good luck!`
      : `Thanks for the feedback! We'll use this to improve your recommendations.`;

    // You can implement a toast notification or other UI feedback here
    console.log(message);
  }

  // Toast notification methods
  private showSuccessToast(message: string): void {
    this.toastMessage = message;
    this.toastType = 'success';
    this.showToast = true;

    // Auto-hide toast after 5 seconds
    setTimeout(() => {
      this.hideToast();
    }, 5000);
  }

  private showErrorToast(message: string): void {
    this.toastMessage = message;
    this.toastType = 'error';
    this.showToast = true;

    // Auto-hide toast after 5 seconds
    setTimeout(() => {
      this.hideToast();
    }, 5000);
  }

  hideToast(): void {
    this.showToast = false;
    this.toastMessage = '';
  }

  // Check if user has already applied to a job
  hasAppliedToJob(jobTitle: string, company: string): boolean {
    return this.applicationHistory.some(
      (app) =>
        app.jobTitle.toLowerCase().trim() === jobTitle.toLowerCase().trim() &&
        app.company.toLowerCase().trim() === company.toLowerCase().trim() &&
        app.applied === true
    );
  }

  // Get application status for a job
  getApplicationStatus(
    jobTitle: string,
    company: string
  ): 'applied' | 'not-applied' | 'unknown' {
    const application = this.applicationHistory.find(
      (app) =>
        app.jobTitle.toLowerCase().trim() === jobTitle.toLowerCase().trim() &&
        app.company.toLowerCase().trim() === company.toLowerCase().trim()
    );

    if (!application) return 'unknown';
    return application.applied ? 'applied' : 'not-applied';
  }

  getMatchPercentage(combinedMatchScore: string): number {
    // Extract numeric value from percentage string (e.g., "80.66%" -> 80.66)
    return parseFloat(combinedMatchScore.replace('%', ''));
  }

  getAverageMatchScore(): number {
    if (this.recommendedJobs.length === 0) return 0;

    const total = this.recommendedJobs.reduce((sum, job) => {
      return sum + this.getMatchPercentage(job.combined_match_score);
    }, 0);

    return Math.round(total / this.recommendedJobs.length);
  }

  getTimeAgo(index: number): string {
    const timeOptions = [
      '2 hours ago',
      '5 hours ago',
      '1 day ago',
      '2 days ago',
      '3 days ago',
      '1 week ago',
    ];
    return timeOptions[index % timeOptions.length];
  }

  getCompanyInitials(companyName: string): string {
    return companyName
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
      .slice(0, 5); // Limit to 5 skills for better UI
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

    if (percentage >= 90) return 'Perfect fit! Apply immediately.';
    if (percentage >= 80) return 'Highly recommended - great opportunity!';
    if (percentage >= 70) return 'Worth considering - good potential.';
    return 'Review requirements carefully.';
  }

  /**
   * Refresh application history from database
   */
  refreshApplicationHistory(): void {
    this.loadExistingApplications();
  }

  /**
   * Format the date posted string for display
   */
  getFormattedDate(datePosted: string): string {
    if (!datePosted) return 'Recently posted';

    try {
      const date = new Date(datePosted);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
      return `${Math.ceil(diffDays / 30)} months ago`;
    } catch (error) {
      return 'Recently posted';
    }
  }

  /**
   * Handle image loading errors by falling back to company initials
   */
  onImageError(event: any, job: Job): void {
    // Hide the broken image and show fallback
    event.target.style.display = 'none';
    // You could also set a flag to show the logo placeholder instead
    job.image_link = ''; // Clear the image link to show fallback
  }

  /**
   * Get a preview of the job description (first 150 characters)
   */
  getJobDescriptionPreview(description: string): string {
    if (!description) return '';

    const cleanDescription = description.replace(/<[^>]*>/g, ''); // Remove HTML tags
    return cleanDescription.length > 150
      ? cleanDescription.substring(0, 150) + '...'
      : cleanDescription;
  }
}
