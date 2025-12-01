import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth-service';  // Import AuthService
import { 
  WatchlistItem, 
  WatchlistResponse, 
  WatchlistStats, 
  WatchlistStatus,
  UpdateWatchlistDetailsRequest 
} from '../models/movie.model';

@Injectable({
  providedIn: 'root'
})
export class WatchlistService {
  private readonly API_BASE_URL = 'http://localhost:8080/api/watchlist';
  
  constructor(
    private http: HttpClient,
    private authService: AuthService  // Inject AuthService
  ) { }

  /**
   * Get HTTP headers with JWT token
   * FIXED: Use AuthService to get token with correct key
   */
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();  // ✅ Use auth service method
    
    // Debug logging
    console.log('🔍 Getting headers for watchlist request...');
    console.log('Token exists:', !!token);
    
    if (token) {
      console.log('Token length:', token.length);
      console.log('Token preview:', token.substring(0, 30) + '...');
      console.log('Token parts:', token.split('.').length, '(should be 3)');
    } else {
      console.error('❌ NO TOKEN FOUND!');
      console.log('Checking all localStorage keys:', Object.keys(localStorage));
      console.log('jwt_token:', localStorage.getItem('jwt_token'));
      console.log('accessToken:', localStorage.getItem('accessToken'));
    }
    
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Add movie to watchlist
   */
  addToWatchlist(movieId: number, status: WatchlistStatus = 'WANT_TO_WATCH'): Observable<WatchlistItem> {
    const params = new HttpParams()
      .set('movieId', movieId.toString())
      .set('status', status);

    console.log('➕ Adding to watchlist:', { movieId, status });

    return this.http.post<WatchlistItem>(
      this.API_BASE_URL,
      null,
      { headers: this.getHeaders(), params }
    ).pipe(
      tap(() => console.log(`✅ Added movie ${movieId} to watchlist`)),
      catchError(this.handleError)
    );
  }

  /**
   * Get user's watchlist
   */
  getWatchlist(page: number = 0, size: number = 20): Observable<WatchlistResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    console.log('📋 Fetching watchlist:', { page, size });

    return this.http.get<WatchlistResponse>(
      this.API_BASE_URL,
      { headers: this.getHeaders(), params }
    ).pipe(
      tap(response => console.log(`✅ Fetched watchlist: ${response.totalElements} items`)),
      catchError(this.handleError)
    );
  }

  /**
   * Get watchlist by status
   */
  getWatchlistByStatus(
    status: WatchlistStatus, 
    page: number = 0, 
    size: number = 20
  ): Observable<WatchlistResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    console.log('🔍 Fetching watchlist by status:', status);

    return this.http.get<WatchlistResponse>(
      `${this.API_BASE_URL}/status/${status}`,
      { headers: this.getHeaders(), params }
    ).pipe(
      tap(response => console.log(`✅ Fetched ${status}: ${response.totalElements} items`)),
      catchError(this.handleError)
    );
  }

  /**
   * Update watchlist status
   */
  updateWatchlistStatus(watchlistId: number, status: WatchlistStatus): Observable<WatchlistItem> {
    const params = new HttpParams().set('status', status);

    console.log('🔄 Updating watchlist status:', { watchlistId, status });

    return this.http.put<WatchlistItem>(
      `${this.API_BASE_URL}/${watchlistId}`,
      null,
      { headers: this.getHeaders(), params }
    ).pipe(
      tap(() => console.log(`✅ Updated watchlist ${watchlistId} to ${status}`)),
      catchError(this.handleError)
    );
  }

  /**
   * Check if movie is in watchlist
   */
  isInWatchlist(movieId: number): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.API_BASE_URL}/check/${movieId}`,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Get watchlist entry for specific movie
   */
  getWatchlistEntry(movieId: number): Observable<WatchlistItem> {
    return this.http.get<WatchlistItem>(
      `${this.API_BASE_URL}/movie/${movieId}`,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Remove from watchlist
   */
  removeFromWatchlist(watchlistId: number): Observable<void> {
    console.log('🗑️ Removing from watchlist:', watchlistId);

    return this.http.delete<void>(
      `${this.API_BASE_URL}/${watchlistId}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => console.log(`✅ Removed watchlist item ${watchlistId}`)),
      catchError(this.handleError)
    );
  }

  /**
   * Get watchlist statistics
   */
  getWatchlistStats(): Observable<WatchlistStats> {
    console.log('📊 Fetching watchlist stats...');
    
    return this.http.get<WatchlistStats>(
      `${this.API_BASE_URL}/stats`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(stats => console.log('✅ Watchlist stats:', stats)),
      catchError(this.handleError)
    );
  }

  /**
   * Update watchlist privacy and notes
   */
  updateWatchlistDetails(
    watchlistId: number, 
    updates: UpdateWatchlistDetailsRequest
  ): Observable<WatchlistItem> {
    let params = new HttpParams();
    
    if (updates.isPublic !== undefined) {
      params = params.set('isPublic', updates.isPublic.toString());
    }
    if (updates.notes !== undefined) {
      params = params.set('notes', updates.notes);
    }

    console.log('📝 Updating watchlist details:', { watchlistId, updates });

    return this.http.patch<WatchlistItem>(
      `${this.API_BASE_URL}/${watchlistId}/details`,
      null,
      { headers: this.getHeaders(), params }
    ).pipe(
      tap(() => console.log(`✅ Updated watchlist ${watchlistId} details`)),
      catchError(this.handleError)
    );
  }

  /**
   * Get friend's public watchlist
   */
  getFriendWatchlist(
    friendId: number, 
    page: number = 0, 
    size: number = 20
  ): Observable<WatchlistResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<WatchlistResponse>(
      `${this.API_BASE_URL}/friend/${friendId}`,
      { headers: this.getHeaders(), params }
    ).pipe(
      tap(response => console.log(`✅ Fetched friend's watchlist: ${response.totalElements} items`)),
      catchError(this.handleError)
    );
  }

  /**
   * Get friends watching a movie
   */
  getFriendsWatchingMovie(movieId: number): Observable<string[]> {
    return this.http.get<string[]>(
      `${this.API_BASE_URL}/friends-watching/${movieId}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(friends => console.log(`✅ Friends watching movie ${movieId}:`, friends)),
      catchError(this.handleError)
    );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    console.error('❌ HTTP Error:', error);

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
      console.error('Client-side error:', error.error.message);
    } else {
      errorMessage = `Error ${error.status}: ${error.message}`;
      console.error('Server error details:', {
        status: error.status,
        statusText: error.statusText,
        message: error.message,
        url: error.url,
        error: error.error
      });
      
      if (error.status === 401 || error.status === 403) {
        errorMessage = 'Unauthorized. Please login again.';
        console.error('⚠️ Authentication error!');
        console.error('Check:');
        console.error('1. Token in localStorage');
        console.error('2. Token format (should have 2 dots)');
        console.error('3. Token in request headers');
      } else if (error.status === 404) {
        errorMessage = 'Resource not found.';
      } else if (error.status === 0) {
        errorMessage = 'Cannot connect to server. Check if backend is running.';
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}