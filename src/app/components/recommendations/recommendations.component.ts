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
import { ApplicationStatus } from '../track-applications/track-applications.component';

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

  constructor(private recommendationsService: RecommendationsService) {}

  ngOnInit(): void {
    this.fetchRecommendedJobs();
    this.loadApplicationHistory();
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
    // Add to application history
    this.applicationHistory.push(trackingData);

    // Save to localStorage for persistence
    this.saveApplicationHistory();

    // Log for debugging (in production, this would be sent to your backend)
    console.log('Application tracked:', trackingData);

    // Here you would typically send this data to your backend API
    // this.recommendationsService.trackApplication(trackingData).subscribe(...);

    // Show success message or update UI as needed
    this.showSuccessMessage(trackingData);

    // If user applied, also save to track-applications format
    if (trackingData.applied) {
      this.saveToTrackApplications(trackingData);
    }
  }

  // Save application data in track-applications format
  private saveToTrackApplications(trackingData: ApplicationTrackingData): void {
    try {
      const trackApplicationsKey = 'trackApplicationsData';
      const stored = localStorage.getItem(trackApplicationsKey);
      let trackApplications = stored ? JSON.parse(stored) : [];

      // Create track application entry
      const trackApplication = {
        id: `${trackingData.jobTitle}-${trackingData.company}`
          .replace(/\s+/g, '-')
          .toLowerCase(),
        jobTitle: trackingData.jobTitle,
        company: trackingData.company,
        status: 'Applied' as ApplicationStatus,
        appliedDate: trackingData.timestamp,
        combinedMatchScore: '85%', // Default score for tracked applications
        skillsRequired: 'JavaScript; TypeScript; Angular; Node.js',
        location: 'Remote',
        jobType: 'Full-time',
        salaryRange: 'Competitive',
      };

      // Check if already exists
      const existingIndex = trackApplications.findIndex(
        (app: any) =>
          app.jobTitle === trackApplication.jobTitle &&
          app.company === trackApplication.company
      );

      if (existingIndex >= 0) {
        // Update existing
        trackApplications[existingIndex] = trackApplication;
      } else {
        // Add new
        trackApplications.push(trackApplication);
      }

      localStorage.setItem(
        trackApplicationsKey,
        JSON.stringify(trackApplications)
      );
    } catch (error) {
      console.error('Error saving to track applications:', error);
    }
  }

  // Handle modal close
  onModalClosed(): void {
    this.showApplyModal = false;
    this.selectedJob = null;
  }

  // Load application history from localStorage
  private loadApplicationHistory(): void {
    try {
      const stored = localStorage.getItem('jobApplicationHistory');
      if (stored) {
        this.applicationHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading application history:', error);
      this.applicationHistory = [];
    }
  }

  // Save application history to localStorage
  private saveApplicationHistory(): void {
    try {
      localStorage.setItem(
        'jobApplicationHistory',
        JSON.stringify(this.applicationHistory)
      );
    } catch (error) {
      console.error('Error saving application history:', error);
    }
  }

  // Show success message (you can customize this based on your UI needs)
  private showSuccessMessage(trackingData: ApplicationTrackingData): void {
    const message = trackingData.applied
      ? `Great! We've recorded your application for ${trackingData.jobTitle}. Good luck!`
      : `Thanks for the feedback! We'll use this to improve your recommendations.`;

    // You can implement a toast notification or other UI feedback here
    console.log(message);
  }

  // Check if user has already applied to a job
  hasAppliedToJob(jobTitle: string, company: string): boolean {
    return this.applicationHistory.some(
      (app) =>
        app.jobTitle === jobTitle &&
        app.company === company &&
        app.applied === true
    );
  }

  // Get application status for a job
  getApplicationStatus(
    jobTitle: string,
    company: string
  ): 'applied' | 'not-applied' | 'unknown' {
    const application = this.applicationHistory.find(
      (app) => app.jobTitle === jobTitle && app.company === company
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
}
