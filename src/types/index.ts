

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface UserProfile {
  id: string;
  username: string;
  avatar_url: string;
}

export interface Comment {
  id: string;
  author: UserProfile;
  text: string;
  timestamp: Date;
  post_id: string;
  user_id: string;
}

export interface Post {
  id: string;
  coordinates: Coordinates;
  text: string;
  imageUrl: string;
  timestamp: Date;
  likes: string[]; // Array of user IDs who liked the post
  isLiked?: boolean; // Optional: To be determined on the client-side
  comments: Comment[];
  comments_count: number;
  category: string;
  author: UserProfile;
}