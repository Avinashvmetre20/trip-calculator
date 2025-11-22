export interface User {
  id: number;
  email: string;
  name?: string;
  created_at: string;
}

export interface AuthResponse {
  status: string;
  token: string;
  user: User;
}
