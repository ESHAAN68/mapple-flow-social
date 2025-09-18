import { SpotifyAuth } from './spotifyAuth';

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; width: number; height: number }>;
  };
  duration_ms: number;
  preview_url?: string;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyPlaybackState {
  is_playing: boolean;
  progress_ms: number;
  item: SpotifyTrack | null;
  device: {
    id: string;
    name: string;
    type: string;
    volume_percent: number;
  } | null;
  shuffle_state: boolean;
  repeat_state: 'off' | 'track' | 'context';
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: Array<{ url: string }>;
  tracks: {
    total: number;
  };
  external_urls: {
    spotify: string;
  };
}

export class SpotifyAPI {
  private auth: SpotifyAuth;
  private baseUrl = 'https://api.spotify.com/v1';

  constructor() {
    this.auth = SpotifyAuth.getInstance();
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.auth.getValidAccessToken();
    if (!token) {
      throw new Error('No valid Spotify access token');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Token expired, try to refresh
      const refreshed = await this.auth.refreshAccessToken();
      if (refreshed) {
        // Retry the request with new token
        const newToken = await this.auth.getValidAccessToken();
        const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers: {
            'Authorization': `Bearer ${newToken}`,
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });
        
        if (!retryResponse.ok) {
          throw new Error(`Spotify API error: ${retryResponse.status}`);
        }
        
        return retryResponse.status === 204 ? null : await retryResponse.json();
      } else {
        throw new Error('Spotify authentication expired');
      }
    }

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`);
    }

    return response.status === 204 ? null : await response.json();
  }

  // Playback Control
  async getCurrentPlayback(): Promise<SpotifyPlaybackState | null> {
    try {
      const data = await this.makeRequest('/me/player');
      return data;
    } catch (error) {
      console.error('Error getting current playback:', error);
      return null;
    }
  }

  async play(contextUri?: string, uris?: string[]): Promise<void> {
    const body: any = {};
    if (contextUri) body.context_uri = contextUri;
    if (uris) body.uris = uris;

    await this.makeRequest('/me/player/play', {
      method: 'PUT',
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
    });
  }

  async pause(): Promise<void> {
    await this.makeRequest('/me/player/pause', {
      method: 'PUT',
    });
  }

  async skipToNext(): Promise<void> {
    await this.makeRequest('/me/player/next', {
      method: 'POST',
    });
  }

  async skipToPrevious(): Promise<void> {
    await this.makeRequest('/me/player/previous', {
      method: 'POST',
    });
  }

  async setVolume(volumePercent: number): Promise<void> {
    await this.makeRequest(`/me/player/volume?volume_percent=${volumePercent}`, {
      method: 'PUT',
    });
  }

  async setShuffle(state: boolean): Promise<void> {
    await this.makeRequest(`/me/player/shuffle?state=${state}`, {
      method: 'PUT',
    });
  }

  async setRepeat(state: 'off' | 'track' | 'context'): Promise<void> {
    await this.makeRequest(`/me/player/repeat?state=${state}`, {
      method: 'PUT',
    });
  }

  async seek(positionMs: number): Promise<void> {
    await this.makeRequest(`/me/player/seek?position_ms=${positionMs}`, {
      method: 'PUT',
    });
  }

  // Library and Playlists
  async getUserPlaylists(): Promise<SpotifyPlaylist[]> {
    try {
      const data = await this.makeRequest('/me/playlists?limit=50');
      return data.items || [];
    } catch (error) {
      console.error('Error getting user playlists:', error);
      return [];
    }
  }

  async getRecentlyPlayed(): Promise<SpotifyTrack[]> {
    try {
      const data = await this.makeRequest('/me/player/recently-played?limit=20');
      return data.items?.map((item: any) => item.track) || [];
    } catch (error) {
      console.error('Error getting recently played:', error);
      return [];
    }
  }

  async searchTracks(query: string): Promise<SpotifyTrack[]> {
    try {
      const data = await this.makeRequest(`/search?q=${encodeURIComponent(query)}&type=track&limit=20`);
      return data.tracks?.items || [];
    } catch (error) {
      console.error('Error searching tracks:', error);
      return [];
    }
  }

  async getDevices(): Promise<any[]> {
    try {
      const data = await this.makeRequest('/me/player/devices');
      return data.devices || [];
    } catch (error) {
      console.error('Error getting devices:', error);
      return [];
    }
  }

  async transferPlayback(deviceId: string): Promise<void> {
    await this.makeRequest('/me/player', {
      method: 'PUT',
      body: JSON.stringify({
        device_ids: [deviceId],
        play: true,
      }),
    });
  }
}