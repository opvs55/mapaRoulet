export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: Date;
}

export interface Post {
  id: string;
  coordinates: Coordinates;
  text: string;
  imageUrl: string;
  timestamp: Date;
  likes: number;
  comments: Comment[];
  category: string;
}