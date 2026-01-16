import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { MovieSearchRequest, MovieSearchResponse, MovieCard } from '../models/movie.model';
import { environment } from '../../environments/environment'


@Injectable({
  providedIn: 'root'
})
export class MovieService {
 private readonly API_BASE_URL = `${environment.apiUrl}/movies`;  
  private readonly httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) { }

  /**
   * Search movies with filters
   * POST /api/movies/search
   * @param searchRequest - The search criteria
   * @returns Observable of MovieSearchResponse
   */
  searchMovies(searchRequest: MovieSearchRequest): Observable<MovieSearchResponse> {
    const url = `${this.API_BASE_URL}/search`;
    
    console.log('Searching movies with request:', searchRequest);
    
    return this.http.post<MovieSearchResponse>(url, searchRequest, this.httpOptions)
      .pipe(
        tap(response => {
          console.log(`Search successful: ${response.totalResults} results found in ${response.searchTimeMs}ms`);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get movie by ID
   * GET /api/movies/{id}
   * @param movieId - The movie ID
   * @returns Observable of MovieCard
   */
  getMovieById(movieId: number): Observable<MovieCard> {
    const url = `${this.API_BASE_URL}/${movieId}`;
    
    console.log('Fetching movie by ID:', movieId);
    
    return this.http.get<MovieCard>(url, this.httpOptions)
      .pipe(
        tap(movie => {
          console.log(`Movie ${movieId} loaded:`, movie.title);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Handle HTTP errors
   * @param error - The HTTP error response
   * @returns Observable that errors with a user-friendly message
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred while searching movies';

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Network error: ${error.error.message}`;
      console.error('Client-side error:', error.error.message);
    } else {
      // Backend returned an unsuccessful response code
      errorMessage = `Server error: ${error.status} - ${error.message}`;
      console.error(`Backend returned code ${error.status}, body was:`, error.error);
    }

    // Return an observable with a user-facing error message
    return throwError(() => new Error(errorMessage));
  }
}