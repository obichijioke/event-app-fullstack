# Organization Management Scripts

Helper scripts to manage organizations and user memberships.

## Prerequisites

```bash
cd api
npm install
```

## Scripts

### 1. Find User Information

Find a user by email or ID and see their organizations:

```bash
npx ts-node scripts/find-user.ts <email_or_id>
```

**Examples:**
```bash
npx ts-node scripts/find-user.ts user@example.com
npx ts-node scripts/find-user.ts clxxx123456789
```

**Output:**
- User ID, email, name, platform role
- List of organizations they belong to
- Creator URLs for each organization

### 2. List User Organizations

List all organizations for a specific user:

```bash
npx ts-node scripts/list-user-organizations.ts <userId>
```

**Example:**
```bash
npx ts-node scripts/list-user-organizations.ts clxxx123456789
```

**Output:**
- Organization ID, name, role
- Event and member counts
- Direct creator URLs

### 3. Create Organization

Create a new organization for a user:

```bash
npx ts-node scripts/create-organization.ts <userId> [organizationName]
```

**Examples:**
```bash
npx ts-node scripts/create-organization.ts clxxx123456789 "My Event Company"
npx ts-node scripts/create-organization.ts clxxx123456789
```

**Output:**
- New organization ID
- Creator URL to start creating events

## Common Workflows

### New Organizer User Setup

1. **Find your user:**
   ```bash
   npx ts-node scripts/find-user.ts organizer@example.com
   ```

2. **Create an organization** (if they don't have one):
   ```bash
   npx ts-node scripts/create-organization.ts <userId> "Event Company Name"
   ```

3. **Copy the creator URL** from the output and use it!

### Check Existing Setup

```bash
# Find user and see all their organizations
npx ts-node scripts/find-user.ts user@example.com

# Or list organizations for a known user ID
npx ts-node scripts/list-user-organizations.ts clxxx123456789
```

## Organization Roles

When a user creates an organization, they become the **owner** with full permissions:

- **owner** - Full control (create/edit/delete everything)
- **manager** - Manage events and members
- **finance** - View financial data and payouts
- **staff** - Basic event management

## Using the Creator

Once you have an organization ID, access the creator at:

```
http://localhost:3001/organizer/events/create?org=<organizationId>
```

Example:
```
http://localhost:3001/organizer/events/create?org=clxxx123456789
```

## Troubleshooting

### "User not found"
- Check the email is correct
- Verify the user exists in the database
- Use Prisma Studio: `npx prisma studio`

### "No organizations found"
- User exists but has no organizations
- Create one with the create-organization script
- Or use the API: `POST /organizations`

### "Permission denied"
- User must be authenticated
- User must be a member of the organization
- Check organization membership in the database

## API Alternative

You can also manage organizations via the REST API:

```bash
# Get user's organizations
GET http://localhost:3000/organizations
Authorization: Bearer <jwt_token>

# Create organization
POST http://localhost:3000/organizations
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "My Event Company"
}
```

## Database Access

For direct database access:

```bash
cd api
npx prisma studio
```

Then navigate to:
- **User** table - Find user IDs
- **Organization** table - View organizations
- **OrgMembership** table - See user-organization relationships


