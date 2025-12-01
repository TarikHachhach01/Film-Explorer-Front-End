import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { MovieService } from '../../services/movie';
import { WatchlistService } from '../../services/watchlist-service';
import { ReviewService } from '../../services/review-service';
import { AuthService } from '../../services/auth-service';
import { MovieCard, WatchlistStatus } from '../../models/movie.model';
import { ReviewResponse, ReviewRequest } from '../../models/review.model';

@Component({
  selector: 'app-movie-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './movie-detail.html',
  styleUrls: ['./movie-detail.css']
})
export class MovieDetailComponent implements OnInit {
  movie: MovieCard | null = null;
  isLoading: boolean = true;
  errorMessage: string = '';
  
  // Watchlist state
  isInWatchlist: boolean = false;
  currentWatchlistId: number | null = null;
  currentStatus: WatchlistStatus | null = null;
  isAddingToWatchlist: boolean = false;
  isAuthenticated: boolean = false;
  
  // Dropdown state
  showStatusDropdown: boolean = false;

  // Available watchlist statuses
  watchlistStatuses = [
    { value: 'WANT_TO_WATCH' as WatchlistStatus, label: '📌 Want to Watch', icon: '📌' },
    { value: 'WATCHING' as WatchlistStatus, label: '👀 Watching', icon: '👀' },
    { value: 'WATCHED' as WatchlistStatus, label: '✅ Watched', icon: '✅' },
    { value: 'NOT_INTERESTED' as WatchlistStatus, label: '❌ Not Interested', icon: '❌' }
  ];

  // Reviews state
  reviews: ReviewResponse[] = [];
  isLoadingReviews: boolean = false;
  currentReviewPage: number = 0;
  totalPages: number = 0;
  totalReviews: number = 0;
  reviewPageSize: number = 10;

  // Review form state
  showReviewForm: boolean = false;
  editingReview: ReviewResponse | null = null;
  isSubmitting: boolean = false;
  reviewForm = {
    rating: 0,
    title: '',
    content: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private movieService: MovieService,
    private watchlistService: WatchlistService,
    private reviewService: ReviewService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('🎬 MovieDetailComponent initialized');
    this.isAuthenticated = this.authService.isAuthenticated();
    console.log('🔐 Is authenticated:', this.isAuthenticated);
    
    const movieId = this.route.snapshot.paramMap.get('id');
    console.log('📽️ Movie ID from route:', movieId);
    
    if (movieId) {
      this.loadMovieDetails(+movieId);
      this.loadReviews(+movieId);
      
      if (this.isAuthenticated) {
        this.checkWatchlistStatus(+movieId);
      }
    }
  }

  /**
   * Load movie details
   */
  loadMovieDetails(movieId: number): void {
    console.log('📡 Loading movie details for ID:', movieId);
    this.isLoading = true;
    
    this.movieService.getMovieById(movieId).subscribe({
      next: (movie) => {
        this.movie = movie;
        this.isLoading = false;
        console.log('✅ Movie loaded:', movie.title);
      },
      error: (error) => {
        this.errorMessage = 'Failed to load movie details';
        this.isLoading = false;
        console.error('❌ Error loading movie:', error);
      }
    });
  }

  /**
   * Check if movie is in user's watchlist
   */
  checkWatchlistStatus(movieId: number): void {
    this.watchlistService.isInWatchlist(movieId).subscribe({
      next: (inWatchlist) => {
        this.isInWatchlist = inWatchlist;
        
        if (inWatchlist) {
          this.watchlistService.getWatchlistEntry(movieId).subscribe({
            next: (entry) => {
              this.currentWatchlistId = entry.id;
              this.currentStatus = entry.status as WatchlistStatus;
              console.log('Movie in watchlist:', entry);
            },
            error: (error) => {
              console.error('Error getting watchlist entry:', error);
            }
          });
        }
      },
      error: (error) => {
        console.error('Error checking watchlist:', error);
      }
    });
  }

  /**
   * Add movie to watchlist
   */
  addToWatchlist(status: WatchlistStatus = 'WANT_TO_WATCH'): void {
    if (!this.isAuthenticated) {
      alert('Please login to add movies to your watchlist');
      this.router.navigate(['/login']);
      return;
    }

    if (!this.movie) return;

    this.isAddingToWatchlist = true;

    this.watchlistService.addToWatchlist(this.movie.id, status).subscribe({
      next: (watchlistItem) => {
        this.isInWatchlist = true;
        this.currentWatchlistId = watchlistItem.id;
        this.currentStatus = status;
        this.isAddingToWatchlist = false;
        this.showStatusDropdown = false;
        console.log('✅ Added to watchlist:', watchlistItem);
      },
      error: (error) => {
        this.isAddingToWatchlist = false;
        console.error('❌ Error adding to watchlist:', error);
        alert('Failed to add to watchlist. Please try again.');
      }
    });
  }

  /**
   * Update watchlist status
   */
  updateWatchlistStatus(newStatus: WatchlistStatus): void {
    if (!this.currentWatchlistId) return;

    this.isAddingToWatchlist = true;

    this.watchlistService.updateWatchlistStatus(this.currentWatchlistId, newStatus).subscribe({
      next: (watchlistItem) => {
        this.currentStatus = newStatus;
        this.isAddingToWatchlist = false;
        this.showStatusDropdown = false;
        console.log('✅ Updated watchlist status:', watchlistItem);
      },
      error: (error) => {
        this.isAddingToWatchlist = false;
        console.error('❌ Error updating watchlist:', error);
        alert('Failed to update watchlist. Please try again.');
      }
    });
  }

  /**
   * Remove from watchlist
   */
  removeFromWatchlist(): void {
    if (!this.currentWatchlistId) return;

    if (!confirm('Remove this movie from your watchlist?')) {
      return;
    }

    this.isAddingToWatchlist = true;

    this.watchlistService.removeFromWatchlist(this.currentWatchlistId).subscribe({
      next: () => {
        this.isInWatchlist = false;
        this.currentWatchlistId = null;
        this.currentStatus = null;
        this.isAddingToWatchlist = false;
        console.log('✅ Removed from watchlist');
      },
      error: (error) => {
        this.isAddingToWatchlist = false;
        console.error('❌ Error removing from watchlist:', error);
        alert('Failed to remove from watchlist. Please try again.');
      }
    });
  }

  /**
   * Toggle status dropdown
   */
  toggleStatusDropdown(): void {
    this.showStatusDropdown = !this.showStatusDropdown;
  }

  /**
   * Get status label
   */
  getStatusLabel(status: WatchlistStatus | null): string {
    if (!status) return 'Add to Watchlist';
    const statusObj = this.watchlistStatuses.find(s => s.value === status);
    return statusObj ? statusObj.label : status;
  }

  /**
   * Get status icon
   */
  getStatusIcon(status: WatchlistStatus | null): string {
    if (!status) return '➕';
    const statusObj = this.watchlistStatuses.find(s => s.value === status);
    return statusObj ? statusObj.icon : '📌';
  }

  /**
   * Go back to search
   */
  goBack(): void {
    this.router.navigate(['/movies']);
  }

  /**
   * Format rating for display
   */
  formatRating(rating: number | bigint): string {
    if (!rating) return 'N/A';
    return Number(rating).toFixed(1);
  }

  // ============================================
  // REVIEWS METHODS
  // ============================================

  /**
   * Load reviews for the movie
   */
  loadReviews(movieId: number): void {
    console.log('📡 Loading reviews for movie ID:', movieId);
    this.isLoadingReviews = true;
    
    this.reviewService.getMovieReviews(movieId, this.currentReviewPage, this.reviewPageSize).subscribe({
      next: (response) => {
        console.log('✅ Reviews response received:', response);
        this.reviews = response.reviews || [];
        this.totalPages = response.totalPages || 0;
        this.totalReviews = response.totalResults || 0;
        this.isLoadingReviews = false;
        console.log(`📊 Reviews loaded: ${this.reviews.length} reviews, ${this.totalReviews} total`);
      },
      error: (error) => {
        console.error('❌ Error loading reviews:', error);
        this.reviews = [];
        this.totalReviews = 0;
        this.totalPages = 0;
        this.isLoadingReviews = false;
      }
    });
  }

  /**
   * Toggle review form
   */
  toggleReviewForm(): void {
    this.showReviewForm = !this.showReviewForm;
    if (!this.showReviewForm) {
      this.cancelReview();
    }
  }

  /**
   * Set rating
   */
  setRating(rating: number): void {
    this.reviewForm.rating = rating;
  }

  /**
   * Check if review form is valid
   */
  isReviewValid(): boolean {
    return this.reviewForm.rating > 0 && 
           this.reviewForm.title.trim().length > 0 && 
           this.reviewForm.content.trim().length > 0;
  }

  /**
   * Submit review
   */
  submitReview(): void {
    if (!this.isReviewValid() || !this.movie) return;

    console.log('📝 Submitting review...');
    this.isSubmitting = true;

    const reviewData: ReviewRequest = {
      movieId: this.movie.id,
      rating: this.reviewForm.rating,
      title: this.reviewForm.title.trim(),
      content: this.reviewForm.content.trim()
    };

    if (this.editingReview) {
      // Update existing review
      console.log('📝 Updating review:', this.editingReview.id);
      this.reviewService.updateReview(this.editingReview.id, reviewData).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showReviewForm = false;
          this.cancelReview();
          this.loadReviews(this.movie!.id);
          console.log('✅ Review updated successfully');
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('❌ Error updating review:', error);
          alert('Failed to update review. Please try again.');
        }
      });
    } else {
      // Create new review
      console.log('📝 Creating new review');
      this.reviewService.createReview(reviewData).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showReviewForm = false;
          this.cancelReview();
          this.loadReviews(this.movie!.id);
          console.log('✅ Review created successfully');
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('❌ Error creating review:', error);
          alert('Failed to post review. Please try again.');
        }
      });
    }
  }

  /**
   * Edit review
   */
  editReview(review: ReviewResponse): void {
    console.log('✏️ Editing review:', review.id);
    this.editingReview = review;
    this.reviewForm = {
      rating: review.rating,
      title: review.title,
      content: review.content
    };
    this.showReviewForm = true;
  }

  /**
   * Cancel review
   */
  cancelReview(): void {
    this.reviewForm = {
      rating: 0,
      title: '',
      content: ''
    };
    this.editingReview = null;
    this.showReviewForm = false;
  }

  /**
   * Delete review
   */
  deleteReview(reviewId: number): void {
    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }

    console.log('🗑️ Deleting review:', reviewId);
    this.reviewService.deleteReview(reviewId).subscribe({
      next: () => {
        this.loadReviews(this.movie!.id);
        console.log('✅ Review deleted successfully');
      },
      error: (error) => {
        console.error('❌ Error deleting review:', error);
        alert('Failed to delete review. Please try again.');
      }
    });
  }

  /**
   * Toggle like on review
   */
  toggleLike(review: ReviewResponse): void {
    if (!this.isAuthenticated) {
      alert('Please login to like reviews');
      return;
    }

    console.log('👍 Toggling like on review:', review.id, 'Currently liked:', review.isLiked);

    if (review.isLiked) {
      // Unlike
      this.reviewService.unlikeReview(review.id).subscribe({
        next: () => {
          review.isLiked = false;
          review.likesCount = Math.max(0, review.likesCount - 1);
          console.log('✅ Review unliked');
        },
        error: (error) => {
          console.error('❌ Error unliking review:', error);
        }
      });
    } else {
      // Like
      this.reviewService.likeReview(review.id).subscribe({
        next: () => {
          review.isLiked = true;
          review.likesCount++;
          console.log('✅ Review liked');
        },
        error: (error) => {
          console.error('❌ Error liking review:', error);
        }
      });
    }
  }

  /**
   * Go to previous page of reviews
   */
  previousPage(): void {
    if (this.currentReviewPage > 0) {
      this.currentReviewPage--;
      this.loadReviews(this.movie!.id);
    }
  }

  /**
   * Go to next page of reviews
   */
  nextPage(): void {
    if (this.currentReviewPage < this.totalPages - 1) {
      this.currentReviewPage++;
      this.loadReviews(this.movie!.id);
    }
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}