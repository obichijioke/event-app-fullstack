# Frontend Integration Guide (Modular Index)

This guide has been split into smaller, feature-focused documents for easier navigation.

Start here: frontend-integration/README.md

Quick links:
- Overview: frontend-integration/overview.md
- Authentication: frontend-integration/authentication.md
- State Management: frontend-integration/state-management.md
- Types: frontend-integration/types.md
- Core Flows: frontend-integration/flows
  - Registration & Login: frontend-integration/flows/registration-login.md
  - Organizations: frontend-integration/flows/organizations.md
  - Events: frontend-integration/flows/events.md
  - Checkout: frontend-integration/flows/checkout.md
  - Ticket Transfers: frontend-integration/flows/transfers.md
  - Check-in: frontend-integration/flows/check-in.md
- Error Handling: frontend-integration/error-handling.md
- Best Practices: frontend-integration/best-practices
  - Security: frontend-integration/best-practices/security.md
  - Performance: frontend-integration/best-practices/performance.md
  - UX: frontend-integration/best-practices/ux.md
- Samples: frontend-integration/samples
  - Vue: frontend-integration/samples/vue.md
  - Angular: frontend-integration/samples/angular.md
  - Svelte: frontend-integration/samples/svelte.md
- Real-time: frontend-integration/realtime
  - Polling: frontend-integration/realtime/polling.md
  - SSE: frontend-integration/realtime/sse.md
  - Webhooks: frontend-integration/realtime/webhooks.md
- Additional Resources: frontend-integration/resources.md

## Homepage Aggregation API (GET `/homepage`)

The backend now exposes a single endpoint that assembles the Eventbrite/Ticketmaster-style homepage sections in one round trip. It is public by default, but sending a bearer token enables personalized trays (followed organizers, recent orders, etc.).

### Query Parameters

| Name | Type | Description |
| --- | --- | --- |
| `city` | `string` | Optional hint to bias results (e.g., `Austin`). |
| `category` | `string` | Category slug priority (e.g., `music`). |
| `latitude` / `longitude` | `number` | Used for future geo-weighted ordering. |
| `radiusKm` | `number` | Distance window (default `100`). |
| `timeframe` | `'today' \| 'weekend' \| 'upcoming'` | Filters events by date range. |
| `segment` | `string` | Audience tag placeholder (family, nightlife, etc.). |

### Response Shape

```jsonc
{
  "hero": {
    "headline": "Events lighting up Austin",
    "subheading": "3 picks for this weekend",
    "featured": [/* EventSummaryDto[] */]
  },
  "filters": {
    "categories": [{ "id": "cat_1", "name": "Music", "slug": "music" }],
    "timeframes": [{ "id": "weekend", "label": "This weekend" }],
    "selected": { "category": "music", "timeframe": "weekend", "city": "Austin" }
  },
  "sections": [
    {
      "id": "trending",
      "title": "Trending in Austin",
      "layout": "carousel",
      "items": [/* EventSummaryDto[] */]
    },
    {
      "id": "category-music",
      "title": "Music spotlights",
      "layout": "carousel",
      "items": [/* ... */],
      "cta": { "label": "Browse all Music", "href": "/events?category=music" }
    },
    {
      "id": "flash-sales",
      "layout": "marquee",
      "items": [/* expiring sale events */]
    }
  ],
  "organizers": [
    {
      "id": "org_123",
      "name": "King Street Live",
      "city": "Austin",
      "followerCount": 2410,
      "upcomingEvents": [{ "id": "evt_1", "title": "Sunset Sessions", "startAt": "..." }]
    }
  ],
  "generatedAt": "2025-10-24T20:00:00.000Z",
  "cache": {
    "key": "homepage:city:austin:category:music:timeframe:weekend:segment:all:radius:100:user:anon",
    "ttlSeconds": 60,
    "hit": false
  }
}
```

Each `EventSummaryDto` contains venue details, pricing (starting price + fee), seatmap flags, promo badges, policy badges, and lightweight `assets`. Layout hints (`carousel`, `grid`, `marquee`) allow the frontend to map sections to the right UI component.

### Frontend Usage Checklist

1. Call `GET /homepage` inside `app/page.tsx` (server component) to hydrate the hero, filters, and trays.
2. Pass the selected filters (`city`, `category`, `timeframe`) back to the endpoint when users tap quick-filter pills so the backend can recompute sections consistently.
3. Use `response.cache.hit` for telemetry/debugging (optional) and respect `hero` being `null` if no curated events exist.
4. Display organizer follow CTAs using the `organizers` array; when the user follows someone, invalidate the endpoint cache (Redis TTL is 60 seconds, so a simple refetch works).

Feature docs:
- Geolocation (Nearby Events): frontend-integration/features/geolocation.md
- Following Organizers: frontend-integration/features/following.md

Related:
- API Documentation: API.md
- Architecture Guide: ARCHITECTURE.md
- Swagger UI (local): http://localhost:3000/api

### Step 2: User Login

```typescript
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  user: User;
}

export class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      '/auth/login',
      credentials,
    );

    // Store access token
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('user', JSON.stringify(response.user));

    return response;
  }
}

// Usage
const handleLogin = async (credentials: LoginRequest) => {
  try {
    const { accessToken, user } = await authService.login(credentials);

    // Update app state
    setUser(user);
    setIsAuthenticated(true);

    // Redirect to dashboard
    navigate('/dashboard');
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.statusCode === 401) {
        showError('Invalid email or password');
      } else {
        showError('Login failed. Please try again.');
      }
    }
  }
};
```

### Step 3: Token Refresh

```typescript
export class AuthService {
  async refreshToken(): Promise<{ accessToken: string }> {
    // Refresh token is sent automatically via HTTP-only cookie
    const response = await apiClient.post<{ accessToken: string }>(
      '/auth/refresh',
      { refreshToken: '' }, // Cookie handles this
    );

    localStorage.setItem('accessToken', response.accessToken);
    return response;
  }

  // Auto-refresh before token expires
  setupTokenRefresh() {
    // Refresh every 14 minutes (token expires in 15 minutes)
    setInterval(
      async () => {
        try {
          await this.refreshToken();
        } catch (error) {
          // Refresh failed, logout user
          this.logout();
        }
      },
      14 * 60 * 1000,
    );
  }
}
```

### Step 4: Logout

```typescript
export class AuthService {
  async logout(): Promise<void> {
    const token = localStorage.getItem('accessToken');

    try {
      await apiClient.post('/auth/logout', {}, token || undefined);
    } finally {
      // Clear local storage even if API call fails
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');

      // Redirect to login
      window.location.href = '/login';
    }
  }
}
```

### Step 5: Protected Routes

```typescript
// React example with React Router
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Usage
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

## State Management

### React Context Example

```typescript
// contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for existing session on mount
    const token = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
      authService.setupTokenRefresh();
    }
  }, []);

  const login = async (credentials: LoginRequest) => {
    const { user } = await authService.login(credentials);
    setUser(user);
    setIsAuthenticated(true);
    authService.setupTokenRefresh();
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const register = async (data: RegisterRequest) => {
    await authService.register(data);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, login, logout, register }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Redux Toolkit Example

```typescript
// store/slices/authSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest) => {
    return await authService.login(credentials);
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null as User | null,
    isAuthenticated: false,
    loading: false,
    error: null as string | null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
```

## TypeScript Type Definitions

### Core Types

```typescript
// types/index.ts

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'attendee' | 'organizer' | 'admin';
  status: 'active' | 'suspended' | 'deleted';
  createdAt: string;
  updatedAt: string;
}

// Organization Types
export interface Organization {
  id: string;
  ownerId: string;
  name: string;
  legalName?: string;
  website?: string;
  country?: string;
  supportEmail?: string;
  taxId?: string;
  status: 'pending' | 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
  _count?: {
    events: number;
    members: number;
    venues: number;
  };
}

export interface OrganizationMember {
  id: string;
  userId: string;
  orgId: string;
  role: 'owner' | 'manager' | 'staff';
  invitedBy?: string;
  joinedAt: string;
  user: User;
}

export interface CreateOrganizationRequest {
  name: string;
  legalName?: string;
  website?: string;
  country?: string;
  supportEmail?: string;
  taxId?: string;
}

export interface AddMemberRequest {
  email: string;
  role: 'owner' | 'manager' | 'staff';
}

// Event Types
export interface Event {
  id: string;
  orgId: string;
  title: string;
  description?: string;
  categoryId?: string;
  venueId?: string;
  seatmapId?: string;
  timezone: string;
  currency: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  isPublic: boolean;
  requiresApproval: boolean;
  ageRestriction?: number;
  createdAt: string;
  updatedAt: string;
  organization?: Organization;
  venue?: Venue;
  occurrences?: EventOccurrence[];
  assets?: EventAsset[];
  policies?: EventPolicies;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  categoryId?: string;
  venueId?: string;
  seatmapId?: string;
  timezone: string;
  currency: string;
  isPublic?: boolean;
  requiresApproval?: boolean;
  ageRestriction?: number;
}

export interface EventOccurrence {
  id: string;
  eventId: string;
  startsAt: string;
  endsAt: string;
  doorsOpenAt?: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface EventAsset {
  id: string;
  eventId: string;
  kind: 'image' | 'pdf' | 'video' | 'seatmap-render';
  url: string;
  altText?: string;
  createdAt: string;
}

export interface EventPolicies {
  id: string;
  eventId: string;
  refundPolicy: 'none' | 'partial' | 'full';
  refundDeadlineHours?: number;
  transferPolicy: 'not_allowed' | 'allowed' | 'allowed_with_fee';
  transferFee?: number;
  cancellationPolicy?: string;
}

// Venue Types
export interface Venue {
  id: string;
  orgId: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  capacity?: number;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

// Ticketing Types
export interface TicketType {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  basePrice: number;
  currency: string;
  quantity: number;
  sold: number;
  minPerOrder: number;
  maxPerOrder: number;
  salesStartAt?: string;
  salesEndAt?: string;
  isPublic: boolean;
  status: 'active' | 'paused' | 'sold_out';
  createdAt: string;
  updatedAt: string;
}

export interface PriceTier {
  id: string;
  ticketTypeId: string;
  name: string;
  price: number;
  quantity: number;
  sold: number;
  startsAt?: string;
  endsAt?: string;
  status: 'active' | 'expired' | 'sold_out';
  createdAt: string;
}

// Order Types
export interface Order {
  id: string;
  userId: string;
  eventId: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
  subtotal: number;
  fees: number;
  discount: number;
  total: number;
  currency: string;
  paymentProvider?: string;
  paymentIntentId?: string;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  tickets?: Ticket[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  ticketTypeId: string;
  priceTierId?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  ticketType?: TicketType;
}

export interface CreateOrderRequest {
  eventId: string;
  items: {
    ticketTypeId: string;
    quantity: number;
    priceTierId?: string;
  }[];
  promoCode?: string;
}

// Ticket Types
export interface Ticket {
  id: string;
  orderId: string;
  ticketTypeId: string;
  userId: string;
  status: 'valid' | 'used' | 'cancelled' | 'transferred';
  qrCode: string;
  price: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  ticketType?: TicketType;
  order?: Order;
}

export interface TicketTransfer {
  id: string;
  ticketId: string;
  fromUserId: string;
  toEmail: string;
  toUserId?: string;
  status: 'pending' | 'completed' | 'cancelled';
  message?: string;
  createdAt: string;
  completedAt?: string;
}

// Promotion Types
export interface Promotion {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  discountType: 'percentage' | 'fixed_amount' | 'free_tickets';
  discountValue: number;
  startsAt?: string;
  endsAt?: string;
  maxUses?: number;
  usedCount: number;
  status: 'active' | 'paused' | 'expired';
  createdAt: string;
}

export interface PromoCode {
  id: string;
  promotionId: string;
  code: string;
  maxUses?: number;
  usedCount: number;
  expiresAt?: string;
  status: 'active' | 'expired' | 'depleted';
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}
```

## Core User Flows

### Flow 1: User Registration and Login

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

### Flow 2: Creating and Managing Organizations

```typescript
// services/organization.service.ts
export class OrganizationService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  async create(
    data: CreateOrganizationRequest,
    token: string
  ): Promise<Organization> {
    return this.apiClient.post<Organization>('/organizations', data, token);
  }

  async list(token: string): Promise<Organization[]> {
    return this.apiClient.get<Organization[]>('/organizations', token);
  }

  async getById(id: string, token: string): Promise<Organization> {
    return this.apiClient.get<Organization>(`/organizations/${id}`, token);
  }

  async update(
    id: string,
    data: Partial<CreateOrganizationRequest>,
    token: string
  ): Promise<Organization> {
    return this.apiClient.patch<Organization>(
      `/organizations/${id}`,
      data,
      token
    );
  }

  async addMember(
    orgId: string,
    data: AddMemberRequest,
    token: string
  ): Promise<OrganizationMember> {
    return this.apiClient.post<OrganizationMember>(
      `/organizations/${orgId}/members`,
      data,
      token
    );
  }

  async listMembers(
    orgId: string,
    token: string
  ): Promise<OrganizationMember[]> {
    return this.apiClient.get<OrganizationMember[]>(
      `/organizations/${orgId}/members`,
      token
    );
  }
}

// Component usage
const CreateOrganizationForm: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<CreateOrganizationRequest>({
    name: '',
    country: 'Nigeria',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('accessToken')!;
      const org = await organizationService.create(formData, token);

      toast.success('Organization created successfully!');
      navigate(`/organizations/${org.id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Organization Name"
        required
      />

      <input
        type="text"
        value={formData.legalName}
        onChange={(e) =>
          setFormData({ ...formData, legalName: e.target.value })
        }
        placeholder="Legal Name (optional)"
      />

      <input
        type="url"
        value={formData.website}
        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
        placeholder="Website (optional)"
      />

      <select
        value={formData.country}
        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
      >
        <option value="Nigeria">Nigeria</option>
        <option value="Ghana">Ghana</option>
        <option value="Kenya">Kenya</option>
        {/* Add more countries */}
      </select>

      <button type="submit">Create Organization</button>
    </form>
  );
};
```

### Flow 3: Creating and Publishing Events

```typescript
// services/event.service.ts
export class EventService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  async create(
    orgId: string,
    data: CreateEventRequest,
    token: string,
  ): Promise<Event> {
    return this.apiClient.post<Event>(`/events/org/${orgId}`, data, token);
  }

  async listPublic(filters?: {
    status?: string;
    categoryId?: string;
    upcoming?: boolean;
    search?: string;
  }): Promise<Event[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.upcoming) params.append('upcoming', 'true');
    if (filters?.search) params.append('search', filters.search);

    return this.apiClient.get<Event[]>(`/events?${params.toString()}`);
  }

  async getById(id: string): Promise<Event> {
    return this.apiClient.get<Event>(`/events/${id}`);
  }

  async update(
    id: string,
    data: Partial<CreateEventRequest>,
    token: string,
  ): Promise<Event> {
    return this.apiClient.patch<Event>(`/events/${id}`, data, token);
  }

  async addOccurrence(
    eventId: string,
    data: {
      startsAt: string;
      endsAt: string;
      doorsOpenAt?: string;
    },
    token: string,
  ): Promise<EventOccurrence> {
    return this.apiClient.post<EventOccurrence>(
      `/events/${eventId}/occurrences`,
      data,
      token,
    );
  }

  async addAsset(
    eventId: string,
    data: {
      kind: 'image' | 'pdf' | 'video' | 'seatmap-render';
      url: string;
      altText?: string;
    },
    token: string,
  ): Promise<EventAsset> {
    return this.apiClient.post<EventAsset>(
      `/events/${eventId}/assets`,
      data,
      token,
    );
  }
}
```

### Flow 4: Purchasing Tickets (Complete Order Flow)

```typescript
// services/order.service.ts
export class OrderService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  async create(
    data: CreateOrderRequest,
    token: string
  ): Promise<Order> {
    return this.apiClient.post<Order>('/orders', data, token);
  }

  async getById(id: string, token: string): Promise<Order> {
    return this.apiClient.get<Order>(`/orders/${id}`, token);
  }

  async processPayment(
    orderId: string,
    data: {
      provider: 'stripe' | 'paystack';
      paymentMethodId: string;
    },
    token: string
  ): Promise<Order> {
    return this.apiClient.post<Order>(
      `/orders/${orderId}/payment/process`,
      data,
      token
    );
  }

  async listMyOrders(token: string): Promise<Order[]> {
    return this.apiClient.get<Order[]>('/orders', token);
  }
}

// Complete checkout flow component
const CheckoutFlow: React.FC<{ eventId: string }> = ({ eventId }) => {
  const [step, setStep] = useState<'select' | 'review' | 'payment' | 'complete'>('select');
  const [selectedTickets, setSelectedTickets] = useState<{
    ticketTypeId: string;
    quantity: number;
    priceTierId?: string;
  }[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  // Step 1: Select tickets
  const handleAddTicket = (ticketTypeId: string, quantity: number) => {
    setSelectedTickets([...selectedTickets, { ticketTypeId, quantity }]);
  };

  // Step 2: Create order
  const handleCreateOrder = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken')!;
      const newOrder = await orderService.create(
        {
          eventId,
          items: selectedTickets,
          promoCode: promoCode || undefined,
        },
        token
      );

      setOrder(newOrder);
      setStep('payment');
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Process payment
  const handlePayment = async (paymentMethodId: string) => {
    if (!order) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken')!;
      const confirmedOrder = await orderService.processPayment(
        order.id,
        {
          provider: 'paystack', // or 'stripe'
          paymentMethodId,
        },
        token
      );

      setOrder(confirmedOrder);
      setStep('complete');
      toast.success('Payment successful! Check your email for tickets.');
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-flow">
      {step === 'select' && (
        <TicketSelection
          eventId={eventId}
          onAddTicket={handleAddTicket}
          selectedTickets={selectedTickets}
          onNext={() => setStep('review')}
        />
      )}

      {step === 'review' && (
        <OrderReview
          selectedTickets={selectedTickets}
          promoCode={promoCode}
          onPromoCodeChange={setPromoCode}
          onBack={() => setStep('select')}
          onConfirm={handleCreateOrder}
          loading={loading}
        />
      )}

      {step === 'payment' && order && (
        <PaymentForm
          order={order}
          onPayment={handlePayment}
          loading={loading}
        />
      )}

      {step === 'complete' && order && (
        <OrderComplete order={order} />
      )}
    </div>
  );
};
```

### Flow 5: Ticket Transfers

```typescript
// services/ticket.service.ts
export class TicketService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  async listMyTickets(token: string): Promise<Ticket[]> {
    return this.apiClient.get<Ticket[]>('/tickets', token);
  }

  async getById(id: string, token: string): Promise<Ticket> {
    return this.apiClient.get<Ticket>(`/tickets/${id}`, token);
  }

  async transfer(
    data: {
      ticketId: string;
      recipientEmail: string;
      message?: string;
    },
    token: string
  ): Promise<TicketTransfer> {
    return this.apiClient.post<TicketTransfer>(
      '/tickets/transfer',
      data,
      token
    );
  }

  async acceptTransfer(
    transferId: string,
    token: string
  ): Promise<TicketTransfer> {
    return this.apiClient.post<TicketTransfer>(
      '/tickets/transfer/accept',
      { transferId },
      token
    );
  }

  async cancelTransfer(
    transferId: string,
    token: string
  ): Promise<void> {
    return this.apiClient.delete<void>(
      `/tickets/transfer/${transferId}`,
      token
    );
  }
}

// Transfer ticket component
const TransferTicketForm: React.FC<{ ticket: Ticket }> = ({ ticket }) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken')!;
      await ticketService.transfer(
        {
          ticketId: ticket.id,
          recipientEmail,
          message,
        },
        token
      );

      toast.success('Transfer initiated! Recipient will receive an email.');
      navigate('/tickets');
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleTransfer}>
      <h3>Transfer Ticket</h3>

      <div>
        <label>Recipient Email</label>
        <input
          type="email"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          required
        />
      </div>

      <div>
        <label>Message (optional)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a personal message..."
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Transferring...' : 'Transfer Ticket'}
      </button>
    </form>
  );
};
```

### Flow 6: Ticket Check-in

```typescript
// services/ticket.service.ts (continued)
export class TicketService {
  async checkin(
    data: {
      ticketId: string;
      occurrenceId: string;
    },
    token: string
  ): Promise<{ success: boolean; message: string }> {
    return this.apiClient.post<{ success: boolean; message: string }>(
      '/tickets/checkin',
      data,
      token
    );
  }

  async getCheckins(
    eventId: string,
    token: string
  ): Promise<any[]> {
    return this.apiClient.get<any[]>(
      `/tickets/events/${eventId}/checkins`,
      token
    );
  }
}

// QR Scanner component for check-in
const QRCheckinScanner: React.FC<{ occurrenceId: string }> = ({
  occurrenceId,
}) => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleScan = async (qrCode: string) => {
    setScanning(true);

    try {
      const token = localStorage.getItem('accessToken')!;

      // Extract ticket ID from QR code
      const ticketId = extractTicketIdFromQR(qrCode);

      const response = await ticketService.checkin(
        {
          ticketId,
          occurrenceId,
        },
        token
      );

      if (response.success) {
        toast.success('Check-in successful!');
        playSuccessSound();
      } else {
        toast.error(response.message);
        playErrorSound();
      }
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.statusCode === 409) {
          toast.error('Ticket already checked in');
        } else {
          toast.error(error.message);
        }
      }
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="qr-scanner">
      <QrReader
        onResult={(result) => {
          if (result && !scanning) {
            handleScan(result.getText());
          }
        }}
        constraints={{ facingMode: 'environment' }}
      />

      {result && <p>Last scan: {result}</p>}
    </div>
  );
};
```

## Error Handling

### Common Error Scenarios

```typescript
// error-handler.ts
export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    switch (error.statusCode) {
      case 400:
        // Validation error
        if (Array.isArray(error.details?.message)) {
          return error.details.message.join(', ');
        }
        return error.message || 'Invalid request';

      case 401:
        // Unauthorized - redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return 'Session expired. Please login again.';

      case 403:
        // Forbidden
        return 'You do not have permission to perform this action.';

      case 404:
        return 'Resource not found.';

      case 409:
        // Conflict (e.g., email already exists)
        return error.message || 'Resource already exists.';

      case 422:
        // Unprocessable entity
        return error.message || 'Validation failed.';

      case 429:
        // Rate limit exceeded
        return 'Too many requests. Please try again later.';

      case 500:
        return 'Server error. Please try again later.';

      default:
        return error.message || 'An unexpected error occurred.';
    }
  }

  return 'An unexpected error occurred.';
};

// Usage in components
try {
  await someApiCall();
} catch (error) {
  const errorMessage = handleApiError(error);
  toast.error(errorMessage);
}
```

### Global Error Boundary (React)

```typescript
// ErrorBoundary.tsx
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error tracking service (e.g., Sentry)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-page">
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Axios Interceptor for Error Handling

```typescript
// axios-config.ts
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken: '', // Cookie handles this
        });

        localStorage.setItem('accessToken', data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
```

## Best Practices

### 1. Security

#### Token Storage

```typescript
// ❌ DON'T: Store tokens in localStorage for sensitive apps
// localStorage is vulnerable to XSS attacks

// ✅ DO: Use httpOnly cookies for refresh tokens (handled by API)
// ✅ DO: Store access tokens in memory or sessionStorage for short-lived sessions

// For maximum security, use a state management solution
class TokenManager {
  private accessToken: string | null = null;

  setToken(token: string) {
    this.accessToken = token;
  }

  getToken(): string | null {
    return this.accessToken;
  }

  clearToken() {
    this.accessToken = null;
  }
}

export const tokenManager = new TokenManager();
```

#### HTTPS Only

```typescript
// Always use HTTPS in production
const API_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://api.yourdomain.com'
    : 'http://localhost:3000';

// Enforce HTTPS
if (
  process.env.NODE_ENV === 'production' &&
  window.location.protocol !== 'https:'
) {
  window.location.href = window.location.href.replace('http:', 'https:');
}
```

#### Input Validation

```typescript
// Validate user input before sending to API
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
});

const handleRegister = (formData: unknown) => {
  try {
    const validData = registerSchema.parse(formData);
    // Proceed with API call
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Display validation errors
      error.errors.forEach((err) => {
        toast.error(err.message);
      });
    }
  }
};
```

### 2. Performance Optimization

#### Caching with React Query

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch events with caching
const useEvents = (filters?: EventFilters) => {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: () => eventService.listPublic(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Mutation with cache invalidation
const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEventRequest) => {
      const token = localStorage.getItem('accessToken')!;
      return eventService.create(orgId, data, token);
    },
    onSuccess: () => {
      // Invalidate and refetch events
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

// Usage
const EventList: React.FC = () => {
  const { data: events, isLoading, error } = useEvents({ upcoming: true });

  if (isLoading) return <Spinner />;
  if (error) return <Error message={handleApiError(error)} />;

  return (
    <div>
      {events?.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
};
```

#### Pagination

```typescript
const useEventsPaginated = (page: number, limit: number) => {
  return useQuery({
    queryKey: ['events', page, limit],
    queryFn: async () => {
      const response = await fetch(
        `${BASE_URL}/events?page=${page}&limit=${limit}`,
      );
      return response.json() as Promise<PaginatedResponse<Event>>;
    },
    keepPreviousData: true, // Keep previous data while fetching new page
  });
};

// Infinite scroll
const useEventsInfinite = () => {
  return useInfiniteQuery({
    queryKey: ['events-infinite'],
    queryFn: ({ pageParam = 1 }) =>
      eventService.listPublic({ page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.meta.page < lastPage.meta.totalPages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
  });
};
```

#### Debouncing Search

```typescript
import { useMemo, useState } from 'react';
import { debounce } from 'lodash';

const EventSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Event[]>([]);

  const debouncedSearch = useMemo(
    () =>
      debounce(async (term: string) => {
        if (term.length < 3) return;

        const events = await eventService.listPublic({ search: term });
        setResults(events);
      }, 500),
    []
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  return (
    <div>
      <input
        type="search"
        value={searchTerm}
        onChange={handleSearch}
        placeholder="Search events..."
      />
      <EventList events={results} />
    </div>
  );
};
```

### 3. UX Recommendations

#### Loading States

```typescript
const EventDetails: React.FC<{ id: string }> = ({ id }) => {
  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventService.getById(id),
  });

  if (isLoading) {
    return <EventDetailsSkeleton />; // Skeleton loader
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return <EventDetailsView event={event!} />;
};
```

#### Optimistic Updates

```typescript
const useTransferTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TransferTicketRequest) => {
      const token = localStorage.getItem('accessToken')!;
      return ticketService.transfer(data, token);
    },
    onMutate: async (newTransfer) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tickets'] });

      // Snapshot previous value
      const previousTickets = queryClient.getQueryData(['tickets']);

      // Optimistically update
      queryClient.setQueryData(['tickets'], (old: Ticket[]) =>
        old.map((ticket) =>
          ticket.id === newTransfer.ticketId
            ? { ...ticket, status: 'transferred' as const }
            : ticket,
        ),
      );

      return { previousTickets };
    },
    onError: (err, newTransfer, context) => {
      // Rollback on error
      queryClient.setQueryData(['tickets'], context?.previousTickets);
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
};
```

## Sample Code Snippets

### Vue 3 Composition API

```typescript
// composables/useAuth.ts
import { ref, computed } from 'vue';
import { authService } from '@/services/auth.service';

const user = ref<User | null>(null);
const accessToken = ref<string | null>(null);

export const useAuth = () => {
  const isAuthenticated = computed(() => !!accessToken.value);

  const login = async (credentials: LoginRequest) => {
    const response = await authService.login(credentials);
    user.value = response.user;
    accessToken.value = response.accessToken;
  };

  const logout = async () => {
    await authService.logout();
    user.value = null;
    accessToken.value = null;
  };

  const register = async (data: RegisterRequest) => {
    await authService.register(data);
  };

  return {
    user: computed(() => user.value),
    isAuthenticated,
    login,
    logout,
    register,
  };
};

// Component usage
<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useRouter } from 'vue-router';

const { login } = useAuth();
const router = useRouter();

const formData = ref({
  email: '',
  password: '',
});

const handleLogin = async () => {
  try {
    await login(formData.value);
    router.push('/dashboard');
  } catch (error) {
    console.error('Login failed:', error);
  }
};
</script>

<template>
  <form @submit.prevent="handleLogin">
    <input v-model="formData.email" type="email" placeholder="Email" />
    <input v-model="formData.password" type="password" placeholder="Password" />
    <button type="submit">Login</button>
  </form>
</template>
```

### Angular Service

```typescript
// auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    // Load user from localStorage on init
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      this.userSubject.next(JSON.parse(savedUser));
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((response) => {
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('user', JSON.stringify(response.user));
          this.userSubject.next(response.user);
        }),
      );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/logout`, {}).pipe(
      tap(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        this.userSubject.next(null);
      }),
    );
  }

  register(data: RegisterRequest): Observable<User> {
    return this.http.post<User>(`${environment.apiUrl}/auth/register`, data);
  }

  get isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  }
}

// Component usage
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class LoginComponent {
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value).subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (error) => console.error('Login failed:', error),
      });
    }
  }
}
```

### Svelte Store

```typescript
// stores/auth.ts
import { writable, derived } from 'svelte/store';
import { authService } from '../services/auth.service';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
}

const createAuthStore = () => {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    accessToken: localStorage.getItem('accessToken'),
    loading: false,
    error: null,
  });

  return {
    subscribe,
    login: async (credentials: LoginRequest) => {
      update((state) => ({ ...state, loading: true, error: null }));
      try {
        const response = await authService.login(credentials);
        set({
          user: response.user,
          accessToken: response.accessToken,
          loading: false,
          error: null,
        });
      } catch (error) {
        update((state) => ({
          ...state,
          loading: false,
          error: error.message,
        }));
      }
    },
    logout: async () => {
      await authService.logout();
      set({ user: null, accessToken: null, loading: false, error: null });
    },
  };
};

export const auth = createAuthStore();
export const isAuthenticated = derived(auth, ($auth) => !!$auth.accessToken);

// Component usage
<script lang="ts">
  import { auth } from './stores/auth';
  import { goto } from '$app/navigation';

  let email = '';
  let password = '';

  async function handleLogin() {
    await auth.login({ email, password });
    if ($auth.user) {
      goto('/dashboard');
    }
  }
</script>

<form on:submit|preventDefault={handleLogin}>
  <input bind:value={email} type="email" placeholder="Email" />
  <input bind:value={password} type="password" placeholder="Password" />
  <button type="submit" disabled={$auth.loading}>
    {$auth.loading ? 'Logging in...' : 'Login'}
  </button>
  {#if $auth.error}
    <p class="error">{$auth.error}</p>
  {/if}
</form>
```

## Real-time Updates

### Polling for Updates

```typescript
// hooks/usePolling.ts
import { useEffect, useRef } from 'react';

export const usePolling = (
  callback: () => void,
  interval: number,
  enabled: boolean = true
) => {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const tick = () => savedCallback.current();
    const id = setInterval(tick, interval);

    return () => clearInterval(id);
  }, [interval, enabled]);
};

// Usage: Poll for ticket availability
const EventTickets: React.FC<{ eventId: string }> = ({ eventId }) => {
  const [tickets, setTickets] = useState<TicketType[]>([]);

  const fetchTickets = async () => {
    const token = localStorage.getItem('accessToken')!;
    const data = await ticketingService.listTicketTypes(eventId, token);
    setTickets(data);
  };

  // Poll every 30 seconds
  usePolling(fetchTickets, 30000, true);

  useEffect(() => {
    fetchTickets();
  }, [eventId]);

  return (
    <div>
      {tickets.map((ticket) => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
};
```

### Server-Sent Events (SSE)

```typescript
// hooks/useSSE.ts
import { useEffect, useState } from 'react';

export const useSSE = <T>(url: string, enabled: boolean = true) => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        setData(parsedData);
      } catch (err) {
        setError(err as Error);
      }
    };

    eventSource.onerror = (err) => {
      setError(new Error('SSE connection error'));
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [url, enabled]);

  return { data, error };
};

// Usage: Real-time ticket availability
const LiveTicketAvailability: React.FC<{ eventId: string }> = ({ eventId }) => {
  const token = localStorage.getItem('accessToken')!;
  const { data: availability } = useSSE<{ available: number }>(
    `${BASE_URL}/events/${eventId}/availability/stream?token=${token}`,
    true
  );

  return (
    <div>
      <h3>Available Tickets</h3>
      <p>{availability?.available ?? 'Loading...'}</p>
    </div>
  );
};
```

### Webhook Integration (for organizers)

```typescript
// services/webhook.service.ts
export class WebhookService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  async create(
    orgId: string,
    data: {
      url: string;
      events: string[];
      secret: string;
    },
    token: string
  ): Promise<Webhook> {
    return this.apiClient.post<Webhook>(
      `/webhooks/orgs/${orgId}/webhooks`,
      data,
      token
    );
  }

  async list(orgId: string, token: string): Promise<Webhook[]> {
    return this.apiClient.get<Webhook[]>(
      `/webhooks/orgs/${orgId}/webhooks`,
      token
    );
  }

  async getEvents(
    orgId: string,
    webhookId: string,
    token: string
  ): Promise<WebhookEvent[]> {
    return this.apiClient.get<WebhookEvent[]>(
      `/webhooks/orgs/${orgId}/webhooks/${webhookId}/events`,
      token
    );
  }

  async retry(
    orgId: string,
    webhookId: string,
    eventId: string,
    token: string
  ): Promise<void> {
    return this.apiClient.post<void>(
      `/webhooks/orgs/${orgId}/webhooks/${webhookId}/events/${eventId}/retry`,
      {},
      token
    );
  }
}

// Component for managing webhooks
const WebhookManager: React.FC<{ orgId: string }> = ({ orgId }) => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [newWebhook, setNewWebhook] = useState({
    url: '',
    events: [] as string[],
    secret: '',
  });

  const handleCreate = async () => {
    const token = localStorage.getItem('accessToken')!;
    const webhook = await webhookService.create(orgId, newWebhook, token);
    setWebhooks([...webhooks, webhook]);
    toast.success('Webhook created successfully!');
  };

  return (
    <div>
      <h2>Webhooks</h2>

      <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
        <input
          type="url"
          value={newWebhook.url}
          onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
          placeholder="Webhook URL"
          required
        />

        <select
          multiple
          value={newWebhook.events}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions, opt => opt.value);
            setNewWebhook({ ...newWebhook, events: selected });
          }}
        >
          <option value="order.created">Order Created</option>
          <option value="order.confirmed">Order Confirmed</option>
          <option value="ticket.transferred">Ticket Transferred</option>
          <option value="ticket.checkedin">Ticket Checked In</option>
        </select>

        <input
          type="password"
          value={newWebhook.secret}
          onChange={(e) => setNewWebhook({ ...newWebhook, secret: e.target.value })}
          placeholder="Webhook Secret"
          required
        />

        <button type="submit">Create Webhook</button>
      </form>

      <div className="webhook-list">
        {webhooks.map((webhook) => (
          <WebhookCard key={webhook.id} webhook={webhook} />
        ))}
      </div>
    </div>
  );
};
```

## Additional Resources

### Recommended Libraries

- **HTTP Client**: `axios` or native `fetch`
- **State Management**: `@tanstack/react-query`, `zustand`, `redux-toolkit`
- **Form Handling**: `react-hook-form`, `formik`
- **Validation**: `zod`, `yup`
- **Date Handling**: `date-fns`, `dayjs`
- **QR Code**: `react-qr-code`, `qrcode.react`
- **QR Scanner**: `react-qr-reader`, `html5-qrcode`
- **Notifications**: `react-hot-toast`, `react-toastify`
- **Payment**: `@stripe/stripe-js`, `@paystack/inline-js`

### Testing API Integration

```typescript
// __tests__/auth.service.test.ts
import { authService } from '../services/auth.service';
import { apiClient } from '../api-client';

jest.mock('../api-client');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should login successfully', async () => {
    const mockResponse = {
      accessToken: 'token123',
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
    };

    (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

    const result = await authService.login({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result).toEqual(mockResponse);
    expect(localStorage.getItem('accessToken')).toBe('token123');
  });

  it('should handle login error', async () => {
    (apiClient.post as jest.Mock).mockRejectedValue(
      new ApiError('Invalid credentials', 401),
    );

    await expect(
      authService.login({
        email: 'test@example.com',
        password: 'wrong',
      }),
    ).rejects.toThrow('Invalid credentials');
  });
});
```

## Summary

This guide provides a comprehensive foundation for integrating with the Event Management API. Key takeaways:

1. **Authentication**: Use JWT tokens with automatic refresh
2. **Error Handling**: Implement global error handling and user-friendly messages
3. **State Management**: Choose appropriate solution for your framework
4. **Performance**: Implement caching, pagination, and debouncing
5. **Security**: Use HTTPS, validate input, store tokens securely
6. **UX**: Provide loading states, optimistic updates, and clear feedback
7. **Real-time**: Use polling or SSE for live updates
8. **Testing**: Write tests for API integration logic

For more details, refer to:

- [API Documentation](./API.md)
- [Swagger UI](http://localhost:3000/api)
- [Architecture Guide](./ARCHITECTURE.md)
