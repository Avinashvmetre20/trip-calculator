export interface Trip {
  id: number;
  name: string;
  description?: string;
  start_date?: Date;
  end_date?: Date;
  currency: string;
  created_by: number;
  created_at: Date;
}

export interface TripMember {
  id: number;
  trip_id: number;
  user_id: number;
  role: 'admin' | 'member';
  joined_at: Date;
}
