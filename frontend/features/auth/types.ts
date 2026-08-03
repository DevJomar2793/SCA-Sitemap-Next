export type AdminUser = {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegistrationDetails = LoginCredentials & {
  full_name: string;
};
