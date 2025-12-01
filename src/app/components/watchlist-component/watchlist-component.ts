import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WatchlistService } from '../../services/watchlist-service';
import { 
  WatchlistItem, 
  WatchlistResponse, 
  WatchlistStats, 
  WatchlistStatus 
} from '../../models/movie.model';

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './watchlist-component.html',
  styleUrls: ['./watchlist-component.css']
})
export class WatchlistComponent implements OnInit {
  
  // Data
  watchlistItems: WatchlistItem[] = [];
  stats: WatchlistStats | null = null;
  
  // State
  isLoading: boolean = false;
  errorMessage: string = '';
  
  // Filters
  selectedStatus: WatchlistStatus | 'ALL' = 'ALL';
  statusOptions: (WatchlistStatus | 'ALL')[] = [
    'ALL',
    'WANT_TO_WATCH', 
    'WATCHING', 
    'WATCHED', 
    'NOT_INTERESTED'
  ];
  
  // Pagination
  currentPage: number = 0;
  totalPages: number = 0;
  pageSize: number = 20;
  totalResults: number = 0;

  // Editing
  editingNotes: { [key: number]: string } = {};
  editingPrivacy: { [key: number]: boolean } = {};

  constructor(private watchlistService: WatchlistService) {}

  ngOnInit(): void {
    this.loadWatchlist();
    this.loadStats();
  }

  /**
   * Load watchlist based on selected filter
   */
  loadWatchlist(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const observable = this.selectedStatus === 'ALL' 
      ? this.watchlistService.getWatchlist(this.currentPage, this.pageSize)
      : this.watchlistService.getWatchlistByStatus(
          this.selectedStatus as WatchlistStatus, 
          this.currentPage, 
          this.pageSize
        );

    observable.subscribe({
      next: (response: WatchlistResponse) => {
        this.watchlistItems = response.content;
        this.totalPages = response.totalPages;
        this.totalResults = response.totalElements;
        this.currentPage = response.number;
        this.isLoading = false;
      },
      error: (error: Error) => {
        this.errorMessage = error.message;
        this.isLoading = false;
        console.error('Error loading watchlist:', error);
      }
    });
  }

  /**
   * Load watchlist statistics
   */
  loadStats(): void {
    this.watchlistService.getWatchlistStats().subscribe({
      next: (stats: WatchlistStats) => {
        this.stats = stats;
      },
      error: (error: Error) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  /**
   * Update watchlist status
   */
  updateStatus(item: WatchlistItem, newStatus: WatchlistStatus): void {
    this.watchlistService.updateWatchlistStatus(item.id, newStatus).subscribe({
      next: (updatedItem: WatchlistItem) => {
        // Update local item
        const index = this.watchlistItems.findIndex(i => i.id === item.id);
        if (index !== -1) {
          this.watchlistItems[index] = updatedItem;
        }
        
        // Reload stats
        this.loadStats();
        
        // If filtering by status, reload list
        if (this.selectedStatus !== 'ALL') {
          this.loadWatchlist();
        }
      },
      error: (error: Error) => {
        this.errorMessage = `Failed to update status: ${error.message}`;
        console.error('Error updating status:', error);
      }
    });
  }

  /**
   * Remove from watchlist
   */
  removeFromWatchlist(item: WatchlistItem): void {
    if (!confirm(`Remove "${item.movieTitle}" from your watchlist?`)) {
      return;
    }

    this.watchlistService.removeFromWatchlist(item.id).subscribe({
      next: () => {
        // Remove from local array
        this.watchlistItems = this.watchlistItems.filter(i => i.id !== item.id);
        this.totalResults--;
        
        // Reload stats
        this.loadStats();
      },
      error: (error: Error) => {
        this.errorMessage = `Failed to remove item: ${error.message}`;
        console.error('Error removing item:', error);
      }
    });
  }

  /**
   * Toggle privacy (public/private)
   */
  togglePrivacy(item: WatchlistItem, isPublic: boolean): void {
    this.watchlistService.updateWatchlistDetails(item.id, { isPublic }).subscribe({
      next: (updatedItem: WatchlistItem) => {
        console.log(`Privacy updated to ${isPublic ? 'public' : 'private'}`);
        // You could update the local item if backend returns privacy info
      },
      error: (error: Error) => {
        this.errorMessage = `Failed to update privacy: ${error.message}`;
        console.error('Error updating privacy:', error);
      }
    });
  }

  /**
   * Save notes for a watchlist item
   */
  saveNotes(item: WatchlistItem, notes: string): void {
    this.watchlistService.updateWatchlistDetails(item.id, { notes }).subscribe({
      next: () => {
        console.log('Notes saved successfully');
        delete this.editingNotes[item.id];
      },
      error: (error: Error) => {
        this.errorMessage = `Failed to save notes: ${error.message}`;
        console.error('Error saving notes:', error);
      }
    });
  }

  /**
   * Filter by status
   */
  filterByStatus(status: WatchlistStatus | 'ALL'): void {
    this.selectedStatus = status;
    this.currentPage = 0;
    this.loadWatchlist();
  }

  /**
   * Pagination
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadWatchlist();
    }
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadWatchlist();
    }
  }

  /**
   * Get status badge color
   */
  getStatusColor(status: WatchlistStatus): string {
    const colors: { [key in WatchlistStatus]: string } = {
      'WANT_TO_WATCH': '#4CAF50',
      'WATCHING': '#2196F3',
      'WATCHED': '#9C27B0',
      'NOT_INTERESTED': '#757575'
    };
    return colors[status] || '#757575';
  }

  /**
   * Get status display text
   */
  getStatusText(status: WatchlistStatus): string {
    const texts: { [key in WatchlistStatus]: string } = {
      'WANT_TO_WATCH': 'Want to Watch',
      'WATCHING': 'Watching',
      'WATCHED': 'Watched',
      'NOT_INTERESTED': 'Not Interested'
    };
    return texts[status] || status;
  }

  /**
   * Format date
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  /**
   * Get poster URL
   */
  getPosterUrl(posterPath: string): string {
    if (!posterPath) {
      return 'assets/no-poster.png';
    }
    return `https://image.tmdb.org/t/p/w500${posterPath}`;
  }

  /**
   * Start editing notes
   */
  startEditingNotes(itemId: number, currentNotes: string = ''): void {
    this.editingNotes[itemId] = currentNotes;
  }

  /**
   * Cancel editing notes
   */
  cancelEditingNotes(itemId: number): void {
    delete this.editingNotes[itemId];
  }

  /**
   * Check if editing notes
   */
  isEditingNotes(itemId: number): boolean {
    return itemId in this.editingNotes;
  }
}