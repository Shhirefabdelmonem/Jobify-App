import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../env/env.developmnet';
import { GoogleService } from './google.service';

export interface RegisterDTO {
  username: string;
  password: string;
}

export interface LogInDTO {
  username: string;
  password: string;
}

export interface GoogleAuthDTO {
  idToken: string;
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
    user?: {
      id: string;
      email: string;
      userName: string;
    };
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

  constructor(
    private http: HttpClient,
    private router: Router,
    private googleService: GoogleService
  ) {}

  authenticateWithGoogle(idToken: string): Observable<AuthResponse> {
    console.log('🔐 Sending Google authentication request with token:', {
      tokenLength: idToken.length,
      tokenStart: idToken.substring(0, 50) + '...',
      tokenParts: idToken.split('.').length,
      timestamp: new Date().toISOString(),
    });

    const googleAuthData: GoogleAuthDTO = {
      idToken: idToken,
    };

    return this.http
      .post<AuthResponse>(`${this.API_URL}/Auth/google`, googleAuthData)
      .pipe(
        tap((response) => {
          console.log('✅ Google authentication response:', response);
          if (response.success && response.data) {
            console.log(
              '🎉 Authentication successful! Storing tokens and navigating...'
            );
            this.storeTokens(response.data);
            this.isAuthenticatedSubject.next(true);
            this.router.navigate(['/profile']);
          } else {
            console.error('❌ Authentication failed:', response.message);
          }
        }),
        catchError((error) => {
          console.log('❌ Google authentication backend error:', {
            status: error.status,
            statusText: error.statusText,
            error: error.error,
            message: error.message,
            headers: error.headers,
            url: error.url,
          });

          // Extract backend error message
          let backendMessage = 'Unknown authentication error';
          if (error.error && typeof error.error === 'object') {
            backendMessage =
              error.error.message || error.error.Message || error.statusText;
          } else if (typeof error.error === 'string') {
            backendMessage = error.error;
          }

          console.log('Backend error message:', backendMessage);

          if (backendMessage.includes('Invalid Google token')) {
            console.log(
              '🚨 Backend says token is invalid. This could be due to:'
            );
            console.log('   1. Token expired');
            console.log('   2. Audience mismatch');
            console.log('   3. Issuer validation failed');
            console.log('   4. Signature verification failed');
            console.log('   5. Token format issues');
            console.log('   6. Backend Google API configuration issues');
            console.log('   7. Network/SSL certificate issues');
            console.log(
              '   8. Clock synchronization issues between client and server'
            );
          }

          console.log('💥 Backend authentication error:', error);
          return throwError(() => error);
        })
      );
  }

  async signInWithGoogle(): Promise<void> {
    console.log('🚀 Starting Google Sign-In process...');
    try {
      const userInfo = await this.googleService.signInWithPopup();
      console.log('👤 Google user info received:', {
        email: userInfo.email,
        name: userInfo.name,
        hasCredential: !!userInfo.credential,
        credentialPreview: userInfo.credential
          ? userInfo.credential.substring(0, 100) + '...'
          : 'None',
      });

      // Debug the JWT token for backend troubleshooting
      if (userInfo.credential) {
        const debugInfo = this.googleService.debugJWTToken(userInfo.credential);
        console.log('🔍 Complete JWT Debug Analysis for Backend:', debugInfo);
      }

      const idToken = this.googleService.createIdToken(userInfo);
      console.log('🎫 Created ID token for backend:', {
        length: idToken.length,
        parts: idToken.split('.').length,
        preview: idToken.substring(0, 100) + '...',
      });

      await this.authenticateWithGoogle(idToken)
        .pipe(
          finalize(() => {
            // Reset loading state regardless of outcome
            console.log('🏁 Google Sign-In process completed');
          })
        )
        .toPromise();
    } catch (error) {
      console.error('💥 Backend authentication error:', error);
      throw error;
    }
  }

  async signUpWithGoogle(): Promise<void> {
    // Same as sign in for Google - the backend will handle user creation
    return this.signInWithGoogle();
  }

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
        refreshToken: refreshToken,
      },
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
