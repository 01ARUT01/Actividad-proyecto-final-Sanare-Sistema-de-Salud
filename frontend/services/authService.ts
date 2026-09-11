import { AuthResponse, RegisterData, LoginData, User, UserRole } from '../types/auth';
import { tt } from '../i18n';
import { API_URL, readErrorMessage, ApiError } from './apiConfig';

const DEMO_ACCOUNTS: Record<string, { email: string; password: string; user: User }> = {
  'admin@saludpublica.com': {
    email: 'admin@saludpublica.com',
    password: '123456',
    user: {
      id: 'demo-admin',
      email: 'admin@saludpublica.com',
      firstName: 'Admin',
      lastName: 'Demo',
      phone: null,
      dni: null,
      role: UserRole.ADMIN,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  'paciente1@email.com': {
    email: 'paciente1@email.com',
    password: '123456',
    user: {
      id: 'demo-patient',
      email: 'paciente1@email.com',
      firstName: 'Paciente',
      lastName: 'Demo',
      phone: null,
      dni: null,
      role: UserRole.PATIENT,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  'doctor1@email.com': {
    email: 'doctor1@email.com',
    password: '123456',
    user: {
      id: 'demo-doctor',
      email: 'doctor1@email.com',
      firstName: 'Doctor',
      lastName: 'Demo',
      phone: null,
      dni: null,
      role: UserRole.DOCTOR,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
};

class AuthService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new ApiError(await readErrorMessage(response, tt('auth.errorRegister')), response.status);
    }

    const authResponse: AuthResponse = await response.json();
    this.setToken(authResponse.accessToken);
    return authResponse;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (this.isDemoLogin(data)) {
          return this.buildDemoAuthResponse(data);
        }

        throw new ApiError(await readErrorMessage(response, tt('auth.errorInvalid')), response.status);
      }

      const authResponse: AuthResponse = await response.json();
      this.setToken(authResponse.accessToken);
      return authResponse;
    } catch (error) {
      if (this.isDemoLogin(data)) {
        return this.buildDemoAuthResponse(data);
      }

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(tt('auth.errorInvalid'), 0);
    }
  }

  async getProfile(): Promise<User> {
    const token = this.getToken();

    if (token?.startsWith('demo-')) {
      const savedUser = this.getStoredDemoUser();
      if (savedUser) {
        return savedUser;
      }
    }

    const response = await fetch(`${API_URL}/auth/profile`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.removeToken();
      }
      throw new ApiError(await readErrorMessage(response, tt('auth.errorProfile')), response.status);
    }

    return response.json();
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  removeToken(): void {
    localStorage.removeItem('token');
  }

  logout(): void {
    this.removeToken();
    localStorage.removeItem('demoUser');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private isDemoLogin(data: LoginData): boolean {
    const email = data.email.trim().toLowerCase();
    const account = DEMO_ACCOUNTS[email];
    return !!account && account.password === data.password;
  }

  private buildDemoAuthResponse(data: LoginData): AuthResponse {
    const email = data.email.trim().toLowerCase();
    const account = DEMO_ACCOUNTS[email];

    if (!account) {
      throw new ApiError(tt('auth.errorInvalid'), 401);
    }

    const token = `demo-${account.user.role.toLowerCase()}`;
    this.setToken(token);
    localStorage.setItem('demoUser', JSON.stringify(account.user));

    return {
      user: account.user,
      accessToken: token,
    };
  }

  private getStoredDemoUser(): User | null {
    const rawUser = localStorage.getItem('demoUser');

    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as User;
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService();