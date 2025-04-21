import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Skip adding token for auth endpoints
  if (req.url.includes('/api/Auth/login') || 
      req.url.includes('/api/Auth/register') || 
      req.url.includes('/api/Auth/refresh-token')) {
    return next(req);
  }

  // Add token to request
  const token = authService.getAccessToken();
  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return next(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 Unauthorized errors (token expired)
        if (error.status === 401) {
          // Try to refresh the token
          return authService.refreshToken().pipe(
            switchMap(() => {
              // Retry the request with the new token
              const newToken = authService.getAccessToken();
              const retryReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`
                }
              });
              return next(retryReq);
            }),
            catchError((refreshError) => {
              // If refresh fails, log out the user
              authService.logout();
              return throwError(() => refreshError);
            })
          );
        }
        return throwError(() => error);
      })
    );
  }
  
  return next(req);
};