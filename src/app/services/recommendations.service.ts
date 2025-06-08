import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../env/env.developmnet';
import { UpdateJobApplicationCommand, UpdateJobApplicationResponse } from './track-applications.service';

export interface Job {
  job_title: string;
  company: string;
  skills_required: string;
  combined_match_score: string;
  semantic_score: string;
  keyword_score: string;
  job_link: string;
  jobApplicationId?: string;
}

export interface RecommendationsResponse {
  statusCode: number;
  data: {
    recommended_jobs: Job[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class RecommendationsService {
  private readonly API_URL = `${environment.baseUrl}/api`;

  constructor(private http: HttpClient) {}

  getRecommendedJobs(): Observable<RecommendationsResponse> {
    return this.http
      .get<RecommendationsResponse>(`${this.API_URL}/Recommendation/get-recommendations`)
      .pipe(
        catchError((error) => {
          console.error('Error fetching recommended jobs:', error);
          return throwError(() => error);
        })
      );
  }

  updateJobApplication(
    jobApplicationId: string,
    command: UpdateJobApplicationCommand
  ): Observable<UpdateJobApplicationResponse> {
    return this.http
      .put<UpdateJobApplicationResponse>(`${this.API_URL}/TrackApplication/${jobApplicationId}`, command)
      .pipe(
        catchError((error) => {
          console.error('Error updating job application:', error);
          return throwError(() => error);
        })
      );
  }
}