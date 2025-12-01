export interface MovieCard {
  id: number;
  title: string;
  releaseYear: number;
  rating: number;
  voteCount: number;
  posterPath: string;
  genres: string[];
  director: string;           // S'assurer que c'est une string
  mainStars: string[];        // S'assurer que c'est un array
  runtime: number;
  imdbRating?: number;
  popularity: number;
  overview: string;
  originalTitle: string;
  isImdbRated: boolean;
}

export interface MovieSearchRequest {
  // Text Search
  query?: string;
  
  // Quick Filters
  highlyRated?: boolean;
  recentlyReleased?: boolean;
  popular?: boolean;
  shortRuntime?: boolean;
  
  // Detailed Filters
  genres?: string[];
  minYear?: number;
  maxYear?: number;
  minRating?: number;
  maxRating?: number;
  minImdbRating?: number;
  maxImdbRating?: number;
  minVoteCount?: number;
  director?: string;
  actors?: string[];
  minRuntime?: number;
  maxRuntime?: number;
  overview?: string;
  searchForeign?: boolean;
  
  // Pagination
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: string;
}

export interface MovieSearchResponse {
  movies: MovieCard[];
  currentPage: number;
  totalPages: number;
  totalResults: number;
  facetCounts?: any;
  searchQuery?: string;
  appliedFilters?: string;
  searchTimeMs?: number;
  sortedBy?: string;
  hasMoreResults?: boolean;
}
export interface WatchlistItem {
  id: number;
  userId: number;
  movieId: number;
  movieTitle: string;
  movieReleaseYear: number;
  moviePosterPath: string;
  status: WatchlistStatus;
  addedAt: string;
  updatedAt: string;
}

export type WatchlistStatus = 'WANT_TO_WATCH' | 'WATCHING' | 'WATCHED' | 'NOT_INTERESTED';

export interface WatchlistStats {
  totalCount: number;
  wantToWatchCount: number;
  watchingCount: number;
  watchedCount: number;
  notInterestedCount: number;
}

export interface WatchlistResponse {
  content: WatchlistItem[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export interface AddToWatchlistRequest {
  movieId: number;
  status?: WatchlistStatus;
}

export interface UpdateWatchlistDetailsRequest {
  isPublic?: boolean;
  notes?: string;
}






