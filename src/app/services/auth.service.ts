import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../env/env.developmnet';

export interface RegisterDTO {
  username: string;
  password: string;
}

export interface LogInDTO {
  username: string;
  password: string;
}

export interface RefreshTokenRequestDTO {
  Request: {
    refreshToken: string;
  };
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = `${environment.baseUrl}/api`;
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly TOKEN_EXPIRES_KEY = 'token_expires';

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(
    this.hasValidToken()
  );
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  register(userData: RegisterDTO): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/Auth/register`, userData)
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this.storeTokens(response.data);
            this.isAuthenticatedSubject.next(true);
          }
        }),
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }

  login(credentials: LogInDTO): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/Auth/login`, credentials)
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this.storeTokens(response.data);
            this.isAuthenticatedSubject.next(true);
          }
        }),
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }

  logout(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      this.clearTokens();
      this.isAuthenticatedSubject.next(false);
      return throwError(() => new Error('No refresh token available'));
    }

    const command = {
      refreshToken: refreshToken,
    };

    return this.http
      .post<AuthResponse>(`${this.API_URL}/Auth/logout`, command)
      .pipe(
        tap(() => {
          this.clearTokens();
          this.isAuthenticatedSubject.next(false);
        }),
        catchError((error) => {
          this.clearTokens();
          this.isAuthenticatedSubject.next(false);
          return throwError(() => error);
        })
      );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const request: RefreshTokenRequestDTO = {
      Request: {
        refreshToken: refreshToken
      }
    };

    return this.http
      .post<AuthResponse>(`${this.API_URL}/Auth/refresh-token`, request)
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this.storeTokens(response.data);
            this.isAuthenticatedSubject.next(true); // Add this line to update the authentication state
          }
        }),
        catchError((error) => {
          this.clearTokens();
          this.isAuthenticatedSubject.next(false);
          return throwError(() => error);
        })
      );
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return this.hasValidToken();
  }

  private hasValidToken(): boolean {
    const expiresString = localStorage.getItem(this.TOKEN_EXPIRES_KEY);
    if (!expiresString) return false;

    const expires = new Date(expiresString);
    return (
      new Date() < expires && !!localStorage.getItem(this.ACCESS_TOKEN_KEY)
    );
  }

  private storeTokens(data: {
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: string;
  }): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, data.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, data.refreshToken);
    localStorage.setItem(this.TOKEN_EXPIRES_KEY, data.accessTokenExpires);
  }

  private clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRES_KEY);
  }
}
