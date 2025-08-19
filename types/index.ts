export interface User {
  email: string;
  name?: string;
}

export interface AuthenticationResponse {
  accessToken?: string;
  user: User;
  demo?: boolean;
}

export interface AuthScreenProps {
  onLogin: (authData: AuthenticationResponse) => void;
}

export interface PlayerScreenProps {
  onLogout: () => void;
}

export interface GoogleAuthResponse {
  type: 'success' | 'error' | 'cancel' | 'dismiss';
  authentication?: {
    accessToken: string;
    refreshToken?: string;
  };
  error?: string;
}