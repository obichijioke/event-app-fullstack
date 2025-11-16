# Testing

This document explains how to run and write tests for the Event Management API.

## Running Tests

### Unit Tests

To run unit tests:

```bash
npm run test
```

To run unit tests in watch mode:

```bash
npm run test:watch
```

To generate unit test coverage:

```bash
npm run test:cov
```

### Integration Tests

To run integration (e2e) tests:

```bash
npm run test:e2e
```

## Test Structure

### Unit Tests

Unit tests are located alongside the source files they test, with a `.spec.ts` extension. For example:

- `src/auth/auth.service.spec.ts` - Tests for the AuthService
- `src/events/events.service.spec.ts` - Tests for the EventsService

### Integration Tests

Integration tests are located in the `src/test` directory and have an `.e2e-spec.ts` extension. These tests test the API endpoints end-to-end.

## Writing Tests

### Unit Tests

Unit tests should focus on testing individual functions and methods in isolation. Use mocking to isolate the unit under test from its dependencies.

Example:

```typescript
describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should register a new user', async () => {
    // Arrange
    const registerDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    jest.spyOn(prismaService.user, 'create').mockResolvedValue(mockUser);

    // Act
    const result = await service.register(registerDto);

    // Assert
    expect(result).toHaveProperty('accessToken');
    expect(result.user.email).toBe('test@example.com');
  });
});
```

### Integration Tests

Integration tests should test the API endpoints end-to-end, including authentication, validation, and database interactions.

Example:

```typescript
describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await createTestingModule();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should register a new user', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    jest.spyOn(prismaService.user, 'create').mockResolvedValue(mockUser as any);

    return request(app.getHttpServer())
      .post('/auth/register')
      .send(registerDto)
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body.user).toHaveProperty('email', 'test@example.com');
      });
  });
});
```

## Test Utilities

### createTestingModule

The `createTestingModule` function in `src/test/setup.ts` creates a testing module with mocked dependencies. Use this function in all integration tests to ensure consistent mocking.

### Mock Data

Mock data objects are provided in `src/test/setup.ts` for common entities like users, organizations, events, etc. Use these mocks in your tests to ensure consistency.

## Best Practices

1. **Test Naming**: Use descriptive test names that explain what is being tested.
2. **Arrange-Act-Assert**: Structure your tests using the Arrange-Act-Assert pattern.
3. **Mocking**: Mock external dependencies to isolate the unit under test.
4. **Coverage**: Aim for high test coverage, but focus on testing critical paths.
5. **Cleanup**: Clean up after tests to avoid interference between tests.
6. **Error Cases**: Test both success and error cases to ensure robust error handling.

## CI/CD Integration

Tests are configured to run automatically in CI/CD pipelines. Ensure all tests pass before merging code changes.
