// src/interfaces/profile.interface.ts

export interface IProfile {
  id?: string;               // UUID from the database
  user_id: string;          // Foreign Key referencing users(id)
  first_name: string;       // character varying(100)
  last_name: string;        // character varying(100)
  date_of_birth: string;    // Date string in YYYY-MM-DD format
  phone_number: string;     // character varying(20)
  avatar_url?: string;      // Optional text field for profile picture
  created_at?: Date;        // Timestamp
  updated_at?: Date;        // Timestamp
}