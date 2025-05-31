import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavSidebarComponent } from '../nav-sidebar/nav-sidebar.component';
import { HeaderComponent } from '../header/header.component';
import {
  RecommendationsService,
  Job,
} from '../../services/recommendations.service';

@Component({
  selector: 'app-recommendations',
  imports: [NavSidebarComponent, HeaderComponent, CommonModule],
  templateUrl: './recommendations.component.html',
  styleUrl: './recommendations.component.css',
})
export class RecommendationsComponent implements OnInit {
  recommendedJobs: Job[] = [];
  isLoading: boolean = true;
  error: string | null = null;

  constructor(private recommendationsService: RecommendationsService) {}

  ngOnInit(): void {
    this.fetchRecommendedJobs();
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
