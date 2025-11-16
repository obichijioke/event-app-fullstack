# Flow: User Registration and Login

```typescript
// services/auth.service.ts
export class AuthService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  async register(data: RegisterRequest): Promise<User> {
    return this.apiClient.post<User>('/auth/register', data);
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.apiClient.post<LoginResponse>(
      '/auth/login',
      credentials
    );

    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('user', JSON.stringify(response.user));

    return response;
  }

  async getProfile(token: string): Promise<User> {
    return this.apiClient.get<User>('/auth/profile', token);
  }

  async updateProfile(data: Partial<User>, token: string): Promise<User> {
    return this.apiClient.patch<User>('/auth/profile', data, token);
  }
}

// Component usage (React)
const RegistrationForm: React.FC = () => {
  const [formData, setFormData] = useState<RegisterRequest>({
    email: '',
    password: '',
    name: '',
    phone: '',
  });
  const [errors, setErrors] = useState<string[]>([]);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    try {
      await authService.register(formData);
      // Auto-login after registration
      const loginResponse = await authService.login({
        email: formData.email,
        password: formData.password,
      });
      navigate('/dashboard');
    } catch (error) {
      if (error instanceof ApiError) {
        if (Array.isArray(error.details?.message)) {
          setErrors(error.details.message);
        } else {
          setErrors([error.message]);
        }
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {errors.length > 0 && (
        <div className="error-messages">
          {errors.map((err, idx) => (
            <p key={idx}>{err}</p>
          ))}
        </div>
      )}

      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
        required
      />

      <input
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        placeholder="Password"
        required
      />

      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Full Name"
        required
      />

      <input
        type="tel"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        placeholder="Phone (optional)"
      />

      <button type="submit">Register</button>
    </form>
  );
};
```

