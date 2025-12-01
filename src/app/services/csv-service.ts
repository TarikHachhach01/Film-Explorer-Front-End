import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from './auth-service';
import { MovieSearchRequest } from '../models/movie.model';

export interface ImportResult {
  successCount: number;
  errorCount: number;
  totalLines: number;
  errors: string[];
  summary: string;
}

@Injectable({
  providedIn: 'root'
})
export class CsvService {
  private readonly API_BASE_URL = 'http://localhost:8080/api/movies';

  constructor(
    private http: HttpClient,
    private authService: AuthService  // ✅ Inject AuthService to get token
  ) { }

  /**
   * Get HTTP headers with JWT token
   */
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Import movies from CSV file (ADMIN only)
   */
  importMovies(file: File): Observable<ImportResult> {
    console.log('📤 Uploading CSV file:', file.name);

    const formData = new FormData();
    formData.append('file', file);

    // Don't set Content-Type header for FormData - browser will set it with boundary
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });

    return this.http.post<ImportResult>(`${this.API_BASE_URL}/import`, formData, { headers }).pipe(
      tap(result => {
        console.log('✅ Import completed:', result.summary);
        console.log('Success:', result.successCount, 'Errors:', result.errorCount);
      })
    );
  }

  /**
   * Export search results to CSV
   */
  exportSearchResults(searchRequest: MovieSearchRequest): Observable<Blob> {
    console.log('📥 Exporting search results to CSV');

    return this.http.post(`${this.API_BASE_URL}/export`, searchRequest, {
      headers: this.getHeaders(),
      responseType: 'blob',
      observe: 'body'
    }).pipe(
      tap(() => console.log('✅ CSV export completed'))
    );
  }

  /**
   * Export current page to CSV
   */
  exportCurrentPage(searchRequest: MovieSearchRequest): Observable<Blob> {
    console.log('📥 Exporting current page to CSV');

    // Use current page settings (don't modify page/size)
    return this.exportSearchResults(searchRequest);
  }

  /**
   * Export ALL search results to CSV (all pages)
   */
  exportAllResults(searchRequest: MovieSearchRequest): Observable<Blob> {
    console.log('📥 Exporting all search results to CSV');

    // Override page/size to get all results
    const allResultsRequest = {
      ...searchRequest,
      page: 0,
      size: 10000  // Large number to get all results
    };

    return this.exportSearchResults(allResultsRequest);
  }

  /**
   * Export ALL movies in database (ADMIN only)
   */
  exportAllMovies(): Observable<Blob> {
    console.log('📥 Admin: Exporting all movies to CSV');

    return this.http.get(`${this.API_BASE_URL}/export/all`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    }).pipe(
      tap(() => console.log('✅ All movies export completed'))
    );
  }

  /**
   * Download blob as file
   */
  downloadFile(blob: Blob, filename: string = 'movies_export.csv'): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
    
    console.log('✅ File downloaded:', filename);
  }

  /**
   * Generate sample CSV template for import
   */
  downloadSampleCsv(): void {
    const sampleData = `title,release_year,vote_average,vote_count,runtime,director,genres_list,overview,poster_path,imdb_rating,star1,star2,star3,star4
The Matrix,1999,8.7,25000,136,Lana Wachowski,"[Action, Sci-Fi]","A computer hacker learns about the true nature of reality.",/path/to/poster.jpg,8.7,Keanu Reeves,Laurence Fishburne,Carrie-Anne Moss,Hugo Weaving
Inception,2010,8.8,32000,148,Christopher Nolan,"[Action, Sci-Fi, Thriller]","A thief who steals corporate secrets through dream-sharing.",/path/to/poster2.jpg,8.8,Leonardo DiCaprio,Joseph Gordon-Levitt,Elliot Page,Tom Hardy
The Shawshank Redemption,1994,9.3,28000,142,Frank Darabont,"[Drama]","Two imprisoned men bond over years.",/path/to/poster3.jpg,9.3,Tim Robbins,Morgan Freeman,Bob Gunton,William Sadler`;

    const blob = new Blob([sampleData], { type: 'text/csv' });
    this.downloadFile(blob, 'sample_movies_import.csv');
    
    console.log('✅ Sample CSV template downloaded');
  }
}