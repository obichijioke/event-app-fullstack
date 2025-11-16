# Flow: Creating and Managing Organizations

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

