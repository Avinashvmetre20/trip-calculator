export interface Trip {
  id: number;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  currency: string;
  created_by: number;
  created_at: string;
  role?: 'admin' | 'member';
}

export interface CreateTripData {
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  currency?: string;
}
