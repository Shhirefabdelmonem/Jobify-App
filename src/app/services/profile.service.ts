import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../env/env.developmnet';

export interface ProfileResponse {
  success: boolean;
  message: string;
  data?: any;
}

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly API_URL = `${environment.baseUrl}/api`;

  constructor(private http: HttpClient) {}

  updateProfile(profileData: any): Observable<ProfileResponse> {
    const mappedData = {
      FirstName: profileData.firstName,
      LastName: profileData.lastName,
      Email: profileData.email,
      Phone: profileData.phone,
      LinkedIn: profileData.linkedin,
      GitHub: profileData.github,
      Portfolio: profileData.portfolio,
      Educations: profileData.educations,
      Experiences: profileData.experiences,
      Skills: profileData.skills,
    };

    return this.http.post<ProfileResponse>(
      `${this.API_URL}/Profile/Update`,
      mappedData
    );
  }

  getProfile(): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>(`${this.API_URL}/Profile`);
  }
}
