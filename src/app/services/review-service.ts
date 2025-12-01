import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ReviewRequest, ReviewResponse, ReviewListResponse, ReviewStats } from '../models/review.model';
import { AuthService } from './auth-service';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private readonly API_BASE_URL = 'http://localhost:8080/api/reviews';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  /**
   * Get reviews for a specific movie
   * ✅ FIXED: Returns empty list if no reviews exist (no error)
   */
  getMovieReviews(movieId: number, page: number = 0, size: number = 10): Observable<ReviewListResponse> {
    const url = `${this.API_BASE_URL}/movie/${movieId}?page=${page}&size=${size}`;
    
    console.log(`📡 Fetching reviews: GET ${url}`);

    return this.http.get<ReviewListResponse>(url, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => {
        console.log('✅ Reviews loaded successfully:', {
          totalResults: response.totalResults,
          currentPage: response.currentPage,
          reviewsCount: response.reviews?.length || 0
        });
      }),
      catchError((error: HttpErrorResponse) => {
        console.warn('⚠️ Error fetching reviews (returning empty list):', error.status, error.message);
        
        // ✅ FIX: Return empty list instead of error for 404 or no content
        if (error.status === 404 || error.status === 204 || error.status === 0) {
          console.log('No reviews found for this movie - returning empty list');
          return of({
            reviews: [],
            currentPage: 0,
            totalPages: 0,
            totalResults: 0
          } as ReviewListResponse);
        }
        
        // For other errors, return empty list too
        console.log('Error occurred but returning empty list for better UX');
        return of({
          reviews: [],
          currentPage: 0,
          totalPages: 0,
          totalResults: 0
        } as ReviewListResponse);
      })
    );
  }

  /**
   * Create a new review
   */
  createReview(request: ReviewRequest): Observable<ReviewResponse> {
    console.log('📡 Creating review:', request);

    return this.http.post<ReviewResponse>(
      this.API_BASE_URL,
      request,
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(response => {
        console.log('✅ Review created successfully:', response.id);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Error creating review:', error);
        
        // Get error message from backend
        const errorMsg = this.extractErrorMessage(error);
        
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  /**
   * Update a review
   */
  updateReview(reviewId: number, request: ReviewRequest): Observable<ReviewResponse> {
    console.log('📡 Updating review:', reviewId, request);

    return this.http.put<ReviewResponse>(
      `${this.API_BASE_URL}/${reviewId}`,
      request,
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(response => {
        console.log('✅ Review updated successfully:', reviewId);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Error updating review:', error);
        const errorMsg = this.extractErrorMessage(error);
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  /**
   * Delete a review
   */
  deleteReview(reviewId: number): Observable<void> {
    console.log('📡 Deleting review:', reviewId);

    return this.http.delete<void>(
      `${this.API_BASE_URL}/${reviewId}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(() => {
        console.log('✅ Review deleted successfully:', reviewId);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Error deleting review:', error);
        const errorMsg = this.extractErrorMessage(error);
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  /**
   * Like a review
   */
  likeReview(reviewId: number): Observable<ReviewResponse> {
    console.log('📡 Liking review:', reviewId);

    return this.http.post<ReviewResponse>(
      `${this.API_BASE_URL}/${reviewId}/like`,
      {},
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(response => {
        console.log('✅ Review liked successfully:', reviewId);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Error liking review:', error);
        const errorMsg = this.extractErrorMessage(error);
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  /**
   * Unlike a review
   */
  unlikeReview(reviewId: number): Observable<ReviewResponse> {
    console.log('📡 Unliking review:', reviewId);

    return this.http.delete<ReviewResponse>(
      `${this.API_BASE_URL}/${reviewId}/like`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(response => {
        console.log('✅ Review unliked successfully:', reviewId);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Error unliking review:', error);
        const errorMsg = this.extractErrorMessage(error);
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  /**
   * Get average rating for a movie
   */
  getAverageRating(movieId: number): Observable<number> {
    const url = `${this.API_BASE_URL}/movie/${movieId}/rating`;

    return this.http.get<number>(url).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching average rating:', error);
        return of(0); // Return 0 if no rating available
      })
    );
  }

  /**
   * Get review count for a movie
   */
  getReviewCount(movieId: number): Observable<number> {
    const url = `${this.API_BASE_URL}/movie/${movieId}/review-count`;

    return this.http.get<number>(url).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching review count:', error);
        return of(0); // Return 0 if error
      })
    );
  }

  /**
   * Get authorization headers with JWT token
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('🔐 Adding auth token to request');
    } else {
      console.log('⚠️ No auth token available');
    }
    
    return new HttpHeaders(headers);
  }

  /**
   * Extract error message from HTTP error response
   */
  private extractErrorMessage(error: HttpErrorResponse): string {
    // If error has a specific message from backend
    if (error.error) {
      if (typeof error.error === 'string') {
        return error.error;
      }
      if (error.error.message) {
        return error.error.message;
      }
    }
    
    // Default messages based on status code
    switch (error.status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'You must be logged in to perform this action.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'Review not found.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return error.message || 'An error occurred';
    }
  }
}