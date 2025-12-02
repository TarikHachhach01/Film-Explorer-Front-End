import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth-service';  
import { 
  WatchlistItem, 
  WatchlistResponse, 
  WatchlistStats, 
  WatchlistStatus,
  UpdateWatchlistDetailsRequest 
} from '../models/movie.model';
import { environment } from '../../environments/environment'
@Injectable({
  providedIn: 'root'
})
export class WatchlistService {
  private readonly API_BASE_URL = `${environment.apiUrl}/watchlist`  
  constructor(
    private http: HttpClient,
    private authService: AuthService  
  ) { }

 
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
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

    return this.http.post<WatchlistItem>(this.API_BASE_URL, null, { 
      params,
      headers: this.getHeaders()  // ✅ ADDED
    }).pipe(
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

    return this.http.get<WatchlistResponse>(this.API_BASE_URL, { 
      params,
      headers: this.getHeaders()  // ✅ ADDED
    }).pipe(
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
      { 
        params,
        headers: this.getHeaders()  // ✅ ADDED
      }
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
      { 
        params,
        headers: this.getHeaders()  // ✅ ADDED
      }
    ).pipe(
      tap(() => console.log(`✅ Updated watchlist ${watchlistId} to ${status}`)),
      catchError(this.handleError)
    );
  }

  /**
   * Check if movie is in watchlist
   */
  isInWatchlist(movieId: number): Observable<boolean> {
    console.log('🔍 Checking if movie in watchlist:', movieId);
    
    return this.http.get<boolean>(`${this.API_BASE_URL}/check/${movieId}`, {
      headers: this.getHeaders()  // ✅ ADDED
    }).pipe(
      tap(inWatchlist => console.log(`Movie ${movieId} in watchlist:`, inWatchlist)),
      catchError(this.handleError)
    );
  }

  /**
   * Get watchlist entry for specific movie
   */
  getWatchlistEntry(movieId: number): Observable<WatchlistItem> {
    return this.http.get<WatchlistItem>(`${this.API_BASE_URL}/movie/${movieId}`, {
      headers: this.getHeaders()  // ✅ ADDED
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Remove from watchlist
   */
  removeFromWatchlist(watchlistId: number): Observable<void> {
    console.log('🗑️ Removing from watchlist:', watchlistId);

    return this.http.delete<void>(`${this.API_BASE_URL}/${watchlistId}`, {
      headers: this.getHeaders()  // ✅ ADDED
    }).pipe(
      tap(() => console.log(`✅ Removed watchlist item ${watchlistId}`)),
      catchError(this.handleError)
    );
  }

  /**
   * Get watchlist statistics
   */
  getWatchlistStats(): Observable<WatchlistStats> {
    console.log('📊 Fetching watchlist stats...');
    
    return this.http.get<WatchlistStats>(`${this.API_BASE_URL}/stats`, {
      headers: this.getHeaders()  // ✅ ADDED
    }).pipe(
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
      { 
        params,
        headers: this.getHeaders()  // ✅ ADDED
      }
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
      { 
        params,
        headers: this.getHeaders()  // ✅ ADDED
      }
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
      {
        headers: this.getHeaders()  // ✅ ADDED
      }
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
    } else {
      errorMessage = `Error ${error.status}: ${error.message}`;
      
      if (error.status === 404) {
        errorMessage = 'Resource not found.';
      } else if (error.status === 0) {
        errorMessage = 'Cannot connect to server.';
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}