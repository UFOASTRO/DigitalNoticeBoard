export type PaperType = 'plain' | 'lined' | 'grid' | 'dot';
export type PinColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple';
export type Role = 'admin' | 'viewer' | 'editor';

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  updated_at?: string;
}

export interface Cluster {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface ClusterMember {
  cluster_id: string;
  user_id: string;
  role: Role;
  joined_at: string;
}

export interface PinContent {
  title?: string;
  body?: string; // The main text content
  paperType?: PaperType;
  paperColor?: string;
  pinColor?: PinColor;
  rotation?: number;
  // For media types later
  url?: string; 
  mimeType?: string;
}

export interface Pin {
  id: string;
  cluster_id: string;
  type: 'sticky' | 'media';
  content: PinContent;
  x: number;
  y: number;
  created_by?: string;
  created_at?: string;
}

export interface Connection {
  id: string;
  cluster_id: string;
  from_pin: string;
  to_pin: string;
  created_at: string;
}

export interface Message {
  id: string;
  cluster_id: string;
  user_id: string;
  pin_id?: string | null; // NULL for general chat
  content: string;
  created_at: string;
}

/**
 * Interface for the Infinite Canvas state
 */
export interface CanvasState {
  scale: number;
  offset: { x: number; y: number };
}