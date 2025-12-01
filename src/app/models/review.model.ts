export interface ReviewRequest {
  movieId: number;
  rating: number;  // 1-10
  title: string;
  content: string;
}

export interface ReviewResponse {
  id: number;
  userId: number;
  movieId: number;
  rating: number;
  title: string;
  content: string;
  likesCount: number;
  createdAt: Date;
  updatedAt?: Date;
  userEmail?: string;  // For display
  isAuthor?: boolean;  // If current user is author
  isLiked?: boolean;   // If current user liked this
}

export interface ReviewListResponse {
  reviews: ReviewResponse[];
  currentPage: number;
  totalPages: number;
  totalResults: number;
}

export interface ReviewStats {
  averageRating: number;
  reviewCount: number;
}