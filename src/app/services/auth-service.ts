import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { RegisterRequest, LoginRequest, AuthenticationResponse, User } from '../models/auth.model';
import { environment } from '../../environments/environment'

@Injectable({
  providedIn: 'root'
})
export class AuthService {
private readonly API_BASE_URL = `${environment.apiUrl}/auth`; 
 private readonly TOKEN_KEY = 'jwt_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'current_user';

  // Observable for authentication state
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // Observable for current user
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private readonly httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) {
    // Check if running in browser before accessing localStorage
    if (this.isBrowser()) {
      this.checkAuthenticationStatus();
    }
  }

  /**
   * Check if code is running in browser
   */
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  /**
   * Register a new user
   */
  register(request: RegisterRequest): Observable<AuthenticationResponse> {
    console.log('Registering user:', request.email);

    return this.http.post<AuthenticationResponse>(
      `${this.API_BASE_URL}/register`,
      request,
      this.httpOptions
    ).pipe(
      tap(response => {
        console.log('Registration successful');
        if (this.isBrowser()) {
          this.storeTokens(response);
        }
      }),
      catchError(error => {
        console.error('Registration failed:', error);
        return throwError(() => new Error(error.error?.message || 'Registration failed'));
      })
    );
  }

  /**
   * Login user
   */
  login(request: LoginRequest): Observable<AuthenticationResponse> {
    console.log('Logging in user:', request.email);

    return this.http.post<AuthenticationResponse>(
      `${this.API_BASE_URL}/login`,
      request,
      this.httpOptions
    ).pipe(
      tap(response => {
        console.log('Login successful');
        if (this.isBrowser()) {
          this.storeTokens(response);
          this.isAuthenticatedSubject.next(true);
        }
      }),
      catchError(error => {
        console.error('Login failed:', error);
        this.isAuthenticatedSubject.next(false);
        return throwError(() => new Error(error.error?.message || 'Invalid credentials'));
      })
    );
  }

  /**
   * Logout user
   */
  logout(): void {
    console.log('Logging out user');
    if (this.isBrowser()) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
    
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
  }

  /**
   * Get JWT token from localStorage
   */
  getToken(): string | null {
    if (!this.isBrowser()) {
      return null;
    }
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get refresh token from localStorage
   */
  getRefreshToken(): string | null {
    if (!this.isBrowser()) {
      return null;
    }
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.hasToken();
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.getUserFromStorage();
  }

  /**
   * Get current user from observable
   */
  getCurrentUser$(): Observable<User | null> {
    return this.currentUser$;
  }

  /**
   * Check if current user is admin
   */
isAdmin(): boolean {
  const token = this.getToken();
  
  if (!token) {
    console.log('🔒 No token found - not admin');
    return false;
  }

  try {
    // Decode JWT token (it's base64 encoded)
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('👤 Token payload:', payload);
    
    // Check if user has ADMIN role
    // The JWT has an authorities array with role strings
    const authorities = payload.authorities || [];
    
    // Check if "ROLE_ADMIN" is in the authorities array
    const isAdmin = authorities.includes('ROLE_ADMIN');
    
    console.log(' Is Admin?', isAdmin);
    console.log(' Authorities:', authorities);
    
    return isAdmin;
  } catch (error) {
    console.error(' Error decoding token:', error);
    return false;
  }
}

  /**
   * Store tokens and user info
   */
  private storeTokens(response: AuthenticationResponse): void {
    if (!this.isBrowser()) {
      return;
    }

    localStorage.setItem(this.TOKEN_KEY, response.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
    
    const user = this.extractUserFromToken(response.accessToken);
    if (user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      this.currentUserSubject.next(user);
    }
  }

  /**
   * Extract user info from JWT token
   */
  private extractUserFromToken(token: string): User | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = JSON.parse(atob(parts[1]));

      const user: User = {
        email: payload.sub,
      };

      return user;
    } catch (error) {
      console.error('Error extracting user from token:', error);
      return null;
    }
  }

  /**
   * Get user from localStorage
   */
  private getUserFromStorage(): User | null {
    if (!this.isBrowser()) {
      return null;
    }

    const userJson = localStorage.getItem(this.USER_KEY);
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch (error) {
        console.error('Error parsing user from storage:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Check if token exists
   */
  private hasToken(): boolean {
    if (!this.isBrowser()) {
      return false;
    }
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Check authentication status on service initialization
   */
  private checkAuthenticationStatus(): void {
    if (!this.isBrowser()) {
      return;
    }

    const hasToken = this.hasToken();
    const user = this.getUserFromStorage();

    this.isAuthenticatedSubject.next(hasToken);
    this.currentUserSubject.next(user);

    console.log('Auth status checked:', { hasToken, user: user?.email });
  }

  /**
   * Add authorization header to requests
   */
  getAuthHeader(): HttpHeaders {
    const token = this.getToken();
    if (token) {
      return new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });
    }
    return this.httpOptions.headers;
  }
}