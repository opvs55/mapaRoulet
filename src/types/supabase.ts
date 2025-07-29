
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      comments: {
        Row: {
          id: string
          created_at: string
          text: string
          user_id: string
          post_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          text: string
          user_id: string
          post_id: string
        }
        Update: {
          created_at?: string
          text?: string
          user_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      posts: {
        Row: {
          category: string
          created_at: string
          id: string
          image_url: string
          lat: number
          lng: number
          text: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          image_url: string
          lat: number
          lng: number
          text: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          image_url?: string
          lat?: number
          lng?: number
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {
      delete_user_account: {
        Args: Record<string, unknown>
        Returns: undefined
      }
      get_nearby_post_ids: {
        Args: {
          user_lat: number
          user_lng: number
          radius_km: number
        }
        Returns: {
          id: string
        }[]
      }
    }
    Enums: {}
    CompositeTypes: {}
  }
}