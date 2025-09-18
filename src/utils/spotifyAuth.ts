interface SpotifyConfig {
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

const SPOTIFY_CONFIG: SpotifyConfig = {
  clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID || 'your-spotify-client-id',
  redirectUri: `${window.location.origin}/auth/spotify/callback`,
  scopes: [
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'user-read-recently-played',
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-library-read',
    'streaming'
  ]
};

export class SpotifyAuth {
  private static instance: SpotifyAuth;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number | null = null;

  static getInstance(): SpotifyAuth {
    if (!SpotifyAuth.instance) {
      SpotifyAuth.instance = new SpotifyAuth();
    }
    return SpotifyAuth.instance;
  }

  constructor() {
    this.loadTokensFromStorage();
  }

  private loadTokensFromStorage() {
    this.accessToken = localStorage.getItem('spotify_access_token');
    this.refreshToken = localStorage.getItem('spotify_refresh_token');
    const expiry = localStorage.getItem('spotify_token_expiry');
    this.tokenExpiry = expiry ? parseInt(expiry) : null;
  }

  private saveTokensToStorage(accessToken: string, refreshToken?: string, expiresIn?: number) {
    this.accessToken = accessToken;
    localStorage.setItem('spotify_access_token', accessToken);
    
    if (refreshToken) {
      this.refreshToken = refreshToken;
      localStorage.setItem('spotify_refresh_token', refreshToken);
    }
    
    if (expiresIn) {
      this.tokenExpiry = Date.now() + (expiresIn * 1000);
      localStorage.setItem('spotify_token_expiry', this.tokenExpiry.toString());
    }
  }

  generateAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: SPOTIFY_CONFIG.clientId,
      response_type: 'code',
      redirect_uri: SPOTIFY_CONFIG.redirectUri,
      scope: SPOTIFY_CONFIG.scopes.join(' '),
      state: Math.random().toString(36).substring(7),
      show_dialog: 'true'
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<boolean> {
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: SPOTIFY_CONFIG.redirectUri,
          client_id: SPOTIFY_CONFIG.clientId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const data = await response.json();
      this.saveTokensToStorage(data.access_token, data.refresh_token, data.expires_in);
      return true;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      return false;
    }
  }

  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: SPOTIFY_CONFIG.clientId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      this.saveTokensToStorage(data.access_token, undefined, data.expires_in);
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.clearTokens();
      return false;
    }
  }

  async getValidAccessToken(): Promise<string | null> {
    if (!this.accessToken) return null;

    // Check if token is expired
    if (this.tokenExpiry && Date.now() >= this.tokenExpiry) {
      const refreshed = await this.refreshAccessToken();
      if (!refreshed) return null;
    }

    return this.accessToken;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_token_expiry');
  }

  logout() {
    this.clearTokens();
  }
}