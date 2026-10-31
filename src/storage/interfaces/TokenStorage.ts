export interface AuthTokens {
  readonly accessToken: string;
  readonly refreshToken: string;
}

export interface TokenStorage {
  getTokens(): Promise<AuthTokens | null>;
  setTokens(tokens: AuthTokens): Promise<void>;
  clearTokens(): Promise<void>;
  subscribe(listener: (tokens: AuthTokens | null) => void): () => void;
}
