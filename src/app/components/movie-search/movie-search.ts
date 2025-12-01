import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MovieService } from '../../services/movie';
import { WatchlistService } from '../../services/watchlist-service';
import { AuthService } from '../../services/auth-service';
import { CsvService } from '../../services/csv-service';
import { MovieSearchRequest, MovieSearchResponse, MovieCard } from '../../models/movie.model';

@Component({
  selector: 'app-movie-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './movie-search.html',
  styleUrls: ['./movie-search.component.css']
})
export class MovieSearchComponent implements OnInit {
  // Search state
  searchQuery: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  
  // Results
  movies: MovieCard[] = [];
  searchResponse: MovieSearchResponse | null = null;

  // Text filters
  overview: string = '';

  // Genre filter
  genres: string[] = [];
  availableGenres = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Crime', 'Adventure'];

  // Rating filters
  minRating: number = 0;
  maxRating: number = 10;
  minImdbRating: number = 0;
  maxImdbRating: number = 10;
  minVoteCount: number = 0;

  // Year filters
  minYear: number = 1990;
  maxYear: number = 2025;

  // Runtime filters
  minRuntime: number = 0;
  maxRuntime: number = 300;

  // Quick filters (toggles)
  highlyRated: boolean = false;
  popular: boolean = false;
  recentlyReleased: boolean = false;
  shortRuntime: boolean = false;
  searchForeign: boolean = true;

  // Sort options
  sortBy: string = 'popularity';
  sortDirection: string = 'desc';

  // Pagination
  currentPage: number = 0;
  pageSize: number = 20;
  totalPages: number = 0;

  // Watchlist state
  movieWatchlistStatus: { [movieId: number]: boolean } = {};
  isAddingToWatchlist: { [movieId: number]: boolean } = {};

  // Auth state
  isAuthenticated: boolean = false;
  isAdmin: boolean = false;

  // CSV Import/Export state
  selectedFile: File | null = null;
  isImporting: boolean = false;
  isExporting: boolean = false;  // ✅ ADDED THIS
  importResult: any = null;
  importError: string = '';

  constructor(
    private movieService: MovieService,
    private watchlistService: WatchlistService,
    private authService: AuthService,
    private csvService: CsvService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    this.isAdmin = this.authService.isAdmin();
    console.log('🔐 Is Admin?', this.isAdmin);
    
    // Load initial popular movies
    this.loadPopularMovies();
  }

  /**
   * Search movies based on current criteria
   */
  searchMovies(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.currentPage = 0;

    // Build search request with all filters
    const searchRequest: MovieSearchRequest = {
      query: this.searchQuery || undefined,
      overview: this.overview || undefined,
      genres: this.genres.length > 0 ? this.genres : undefined,
      minRating: this.minRating > 0 ? this.minRating : undefined,
      maxRating: this.maxRating < 10 ? this.maxRating : undefined,
      minImdbRating: this.minImdbRating > 0 ? this.minImdbRating : undefined,
      maxImdbRating: this.maxImdbRating < 10 ? this.maxImdbRating : undefined,
      minVoteCount: this.minVoteCount > 0 ? this.minVoteCount : undefined,
      minYear: this.minYear > 1990 ? this.minYear : undefined,
      maxYear: this.maxYear < 2025 ? this.maxYear : undefined,
      minRuntime: this.minRuntime > 0 ? this.minRuntime : undefined,
      maxRuntime: this.maxRuntime < 300 ? this.maxRuntime : undefined,
      highlyRated: this.highlyRated || undefined,
      popular: this.popular || undefined,
      recentlyReleased: this.recentlyReleased || undefined,
      shortRuntime: this.shortRuntime || undefined,
      searchForeign: this.searchForeign || undefined,
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };

    // Call the service
    this.movieService.searchMovies(searchRequest).subscribe({
      next: (response: MovieSearchResponse) => {
        this.handleSearchSuccess(response);
      },
      error: (error: Error) => {
        this.handleSearchError(error);
      }
    });
  }

  /**
   * Search with new criteria (alias for searchMovies)
   * ✅ ADDED THIS METHOD
   */
  searchWithNewCriteria(): void {
    this.searchMovies();
  }

  /**
   * Build search request from current filters
   */
  private buildSearchRequest(): MovieSearchRequest {
    return {
      query: this.searchQuery || undefined,
      overview: this.overview || undefined,
      genres: this.genres.length > 0 ? this.genres : undefined,
      minRating: this.minRating > 0 ? this.minRating : undefined,
      maxRating: this.maxRating < 10 ? this.maxRating : undefined,
      minImdbRating: this.minImdbRating > 0 ? this.minImdbRating : undefined,
      maxImdbRating: this.maxImdbRating < 10 ? this.maxImdbRating : undefined,
      minVoteCount: this.minVoteCount > 0 ? this.minVoteCount : undefined,
      minYear: this.minYear > 1990 ? this.minYear : undefined,
      maxYear: this.maxYear < 2025 ? this.maxYear : undefined,
      minRuntime: this.minRuntime > 0 ? this.minRuntime : undefined,
      maxRuntime: this.maxRuntime < 300 ? this.maxRuntime : undefined,
      highlyRated: this.highlyRated || undefined,
      popular: this.popular || undefined,
      recentlyReleased: this.recentlyReleased || undefined,
      shortRuntime: this.shortRuntime || undefined,
      searchForeign: this.searchForeign || undefined,
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };
  }

  /**
   * Load popular movies on initial page load
   */
  private loadPopularMovies(): void {
    this.isLoading = true;
    
    const searchRequest: MovieSearchRequest = {
      popular: true,
      page: 0,
      size: 20,
      sortBy: 'popularity',
      sortDirection: 'desc'
    };

    this.movieService.searchMovies(searchRequest).subscribe({
      next: (response: MovieSearchResponse) => {
        this.handleSearchSuccess(response);
      },
      error: (error: Error) => {
        this.handleSearchError(error);
      }
    });
  }

  /**
   * Handle successful search response
   */
  private handleSearchSuccess(response: MovieSearchResponse): void {
    this.searchResponse = response;
    this.movies = response.movies;
    this.totalPages = response.totalPages;
    this.isLoading = false;
    
    // Check watchlist status for movies
    this.checkWatchlistStatusForMovies();
    
    console.log('Search completed:', {
      totalResults: response.totalResults,
      searchTime: response.searchTimeMs,
      appliedFilters: response.appliedFilters
    });
  }

  /**
   * Handle search error
   */
  private handleSearchError(error: Error): void {
    this.errorMessage = error.message;
    this.isLoading = false;
    this.movies = [];
    console.error('Search failed:', error);
  }

  /**
   * Toggle genre selection
   */
  toggleGenre(genre: string): void {
    const index = this.genres.indexOf(genre);
    if (index > -1) {
      this.genres.splice(index, 1);
    } else {
      this.genres.push(genre);
    }
  }

  /**
   * Check if genre is selected
   */
  isGenreSelected(genre: string): boolean {
    return this.genres.includes(genre);
  }

  /**
   * Clear all filters and reset to defaults
   */
  clearFilters(): void {
    this.searchQuery = '';
    this.overview = '';
    this.genres = [];
    this.minRating = 0;
    this.maxRating = 10;
    this.minImdbRating = 0;
    this.maxImdbRating = 10;
    this.minVoteCount = 0;
    this.minYear = 1990;
    this.maxYear = 2025;
    this.minRuntime = 0;
    this.maxRuntime = 300;
    this.highlyRated = false;
    this.popular = false;
    this.recentlyReleased = false;
    this.shortRuntime = false;
    this.searchForeign = true;
    this.sortBy = 'popularity';
    this.sortDirection = 'desc';
    this.loadPopularMovies();
  }

  /**
   * Go to previous page
   */
  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.searchMovies();
    }
  }

  /**
   * Go to next page
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.searchMovies();
    }
  }

  /**
   * Change page size
   */
  changePageSize(event: any): void {
    this.pageSize = parseInt(event.target.value);
    this.currentPage = 0;
    this.searchMovies();
  }

  /**
   * Get display rating for a movie
   */
  getDisplayRating(movie: MovieCard): number {
    return movie.rating || 0;
  }

  /**
   * Get rating source (IMDB or TMDb)
   */
  getRatingSource(movie: MovieCard): string {
    return movie.isImdbRated ? 'IMDB' : 'TMDb';
  }

  /**
   * Format rating for display
   */
  formatRating(rating: any): string {
    if (!rating) return 'N/A';
    return typeof rating === 'number' ? rating.toFixed(1) : rating;
  }

  // ============================================
  // WATCHLIST METHODS
  // ============================================

  /**
   * Check if movie is in watchlist
   */
  isMovieInWatchlist(movieId: number): boolean {
    return this.movieWatchlistStatus[movieId] || false;
  }

  /**
   * Quick add to watchlist from movie card
   */
  quickAddToWatchlist(movieId: number, event: Event): void {
    event.stopPropagation();

    if (!this.isAuthenticated) {
      alert('Please login to add movies to your watchlist');
      this.router.navigate(['/login']);
      return;
    }

    if (this.movieWatchlistStatus[movieId]) {
      this.viewMovieDetail(movieId);
      return;
    }

    this.isAddingToWatchlist[movieId] = true;

    this.watchlistService.addToWatchlist(movieId, 'WANT_TO_WATCH').subscribe({
      next: (watchlistItem) => {
        this.movieWatchlistStatus[movieId] = true;
        this.isAddingToWatchlist[movieId] = false;
        console.log('✅ Added movie to watchlist:', watchlistItem);
      },
      error: (error) => {
        this.isAddingToWatchlist[movieId] = false;
        console.error('❌ Error adding to watchlist:', error);
        alert('Failed to add to watchlist. Please try again.');
      }
    });
  }

  /**
   * Navigate to movie detail page
   */
  viewMovieDetail(movieId: number): void {
    this.router.navigate(['/movies', movieId]);
  }

  /**
   * Check watchlist status for displayed movies
   */
  checkWatchlistStatusForMovies(): void {
    if (!this.isAuthenticated || this.movies.length === 0) {
      return;
    }

    this.movies.forEach(movie => {
      this.watchlistService.isInWatchlist(movie.id).subscribe({
        next: (inWatchlist) => {
          this.movieWatchlistStatus[movie.id] = inWatchlist;
        },
        error: (error) => {
          console.error(`Error checking watchlist for movie ${movie.id}:`, error);
        }
      });
    });
  }

  // ============================================
  // CSV IMPORT/EXPORT METHODS
  // ============================================

  /**
   * Handle file selection
   */
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        this.importError = 'Please select a CSV file';
        this.selectedFile = null;
        return;
      }
      this.selectedFile = file;
      this.importError = '';
      this.importResult = null;
    }
  }

  /**
   * Upload CSV file
   */
  uploadCsvFile(): void {
    if (!this.selectedFile) {
      this.importError = 'Please select a file first';
      return;
    }

    this.isImporting = true;
    this.importError = '';
    this.importResult = null;

    this.csvService.importMovies(this.selectedFile).subscribe({
      next: (result) => {
        this.isImporting = false;
        this.importResult = result;
        this.selectedFile = null;
        console.log('✅ Import completed:', result);
        
        // Refresh movie list after 2 seconds
        setTimeout(() => {
          this.searchMovies();
        }, 2000);
      },
      error: (error) => {
        this.isImporting = false;
        this.importError = error.message || 'Import failed';
        console.error('❌ Import error:', error);
      }
    });
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Export current page results
   */
  exportCurrentPage(): void {
    this.isExporting = true;  // ✅ SET FLAG
    const searchRequest = this.buildSearchRequest();
    this.csvService.exportCurrentPage(searchRequest).subscribe({
      next: () => {
        this.isExporting = false;  // ✅ RESET FLAG
        console.log('✅ Export completed');
      },
      error: (error) => {
        this.isExporting = false;  // ✅ RESET FLAG
        console.error('❌ Export error:', error);
        alert('Failed to export movies');
      }
    });
  }

  /**
   * Export all search results
   */
  exportAllResults(): void {
    this.isExporting = true;  // ✅ SET FLAG
    const searchRequest = this.buildSearchRequest();
    this.csvService.exportAllResults(searchRequest).subscribe({
      next: () => {
        this.isExporting = false;  // ✅ RESET FLAG
        console.log('✅ Export all completed');
      },
      error: (error) => {
        this.isExporting = false;  // ✅ RESET FLAG
        console.error('❌ Export error:', error);
        alert('Failed to export movies');
      }
    });
  }

  /**
   * Download sample CSV
   */
  downloadSampleCsv(): void {
    this.csvService.downloadSampleCsv();
  }
}