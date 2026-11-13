// ========================================================
// API CLIENT PARA CITASYA (FRONTEND)
// ========================================================

const API = {
  baseUrl: '/api',

  getToken() {
    return localStorage.getItem('citasya_token');
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('citasya_token', token);
    } else {
      localStorage.removeItem('citasya_token');
    }
  },

  getCurrentUser() {
    try {
      const u = localStorage.getItem('citasya_user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  },

  setCurrentUser(user) {
    if (user) {
      localStorage.setItem('citasya_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('citasya_user');
    }
  },

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (err) {
      console.error(`Error en API ${endpoint}:`, err);
      throw err;
    }
  },

  // Auth
  async login(email, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setToken(res.token);
    this.setCurrentUser(res.user);
    return res;
  },

  async register(profileData) {
    const res = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(profileData)
    });
    this.setToken(res.token);
    this.setCurrentUser(res.user);
    return res;
  },

  async getMe() {
    const res = await this.request('/auth/me');
    this.setCurrentUser(res.user);
    return res.user;
  },

  async getDemoUsers() {
    const res = await this.request('/auth/demo-users');
    return res.demoAccounts || [];
  },

  async getStatus() {
    return await this.request('/status');
  },

  // Perfiles & Swipe
  async getDiscoverProfiles(gender = 'todos') {
    const query = gender && gender !== 'todos' ? `?gender=${encodeURIComponent(gender)}` : '';
    const res = await this.request(`/profiles/discover${query}`);
    return res.profiles || [];
  },

  async getProfile(id) {
    const res = await this.request(`/profiles/${id}`);
    return res.profile;
  },

  async updateProfile(updates) {
    const res = await this.request('/profiles/me', {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    this.setCurrentUser(res.user);
    return res.user;
  },

  async resetSwipes() {
    return await this.request('/profiles/reset-swipes', { method: 'POST' });
  },

  async swipe(targetId, action) {
    return await this.request('/swipes', {
      method: 'POST',
      body: JSON.stringify({ targetId, action })
    });
  },

  // Matches & Chat
  async getMatches() {
    const res = await this.request('/matches');
    return res.matches || [];
  },

  async getMessages(matchId) {
    const res = await this.request(`/matches/${matchId}/messages`);
    return res.messages || [];
  },

  async sendMessage(matchId, text) {
    const res = await this.request(`/matches/${matchId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text })
    });
    return res.message;
  },

  logout() {
    this.setToken(null);
    this.setCurrentUser(null);
  }
};

