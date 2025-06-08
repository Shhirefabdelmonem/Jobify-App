import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../env/env.developmnet';

export type ApplicationStatus =
  | 'Applied'
  | 'Get Assessment'
  | 'Interviewing'
  | 'Offer Received'
  | 'Rejected'
  | 'Archived';

export interface JobApplicationDto {
  jobApplicationId: number;
  jobTitle: string;
  company: string;
  skillsRequired: string;
  combinedMatchScore: string;
  jobLink: string;
  status: string;
  updateDate: Date;
  jobSeekerId: string;
}

export interface UpdateJobApplicationCommand {
  jobTitle: string;
  company: string;
  skillsRequired: string;
  combinedMatchScore: string;
  jobLink: string;
  status: ApplicationStatus;
}

export interface JobApplicationListDto {
  jobApplications: JobApplicationDto[];
  totalCount: number;
}

export interface GetAllJobApplicationResponse {
  success: boolean;
  message: string;
  data: JobApplicationListDto;
  statusCode: number;
}

export interface UpdateJobApplicationResponse {
  success: boolean;
  message: string;
  data: JobApplicationDto;
  statusCode: number;
}

export interface AddJobApplicationCommand {
  jobApplicationId?: number; // Optional since it's auto-generated
  jobTitle: string;
  company: string;
  skillsRequired: string;
  combinedMatchScore: string;
  jobLink: string;
  status?: string; // Optional, defaults to "Applied" in backend
  updateDate?: Date; // Optional, defaults to current date in backend
}

export interface AddJobApplicationResponse {
  success: boolean;
  message: string;
  statusCode: number;
}

@Injectable({
  providedIn: 'root',
})
export class TrackApplicationsService {
  private readonly API_URL = `${environment.baseUrl}/api/TrackApplication`;

  constructor(private http: HttpClient) {}

  getAllJobApplications(): Observable<GetAllJobApplicationResponse> {
    return this.http
      .get<GetAllJobApplicationResponse>(`${this.API_URL}/all-applications`)
      .pipe(
        catchError((error) => {
          console.error('Error fetching job applications:', error);
          return throwError(() => error);
        })
      );
  }

  updateJobApplication(
    id: number,
    command: UpdateJobApplicationCommand
  ): Observable<UpdateJobApplicationResponse> {
    return this.http
      .put<UpdateJobApplicationResponse>(`${this.API_URL}/${id}`, command)
      .pipe(
        catchError((error) => {
          console.error('Error updating job application:', error);
          return throwError(() => error);
        })
      );
  }

  addJobApplication(
    command: AddJobApplicationCommand
  ): Observable<AddJobApplicationResponse> {
    return this.http
      .post<AddJobApplicationResponse>(`${this.API_URL}`, command)
      .pipe(
        catchError((error) => {
          console.error('Error adding job application:', error);
          return throwError(() => error);
        })
      );
  }
}
