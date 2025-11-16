# Organization Settings & Team Management

All organization management endpoints live under `/organizer/organization` and mirror the functionality of the existing Organizations module while scoping responses to a single `orgId`.

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/organizer/organization?orgId={organizationId}` | Fetch profile information for the organization. |
| `PATCH` | `/organizer/organization?orgId={organizationId}` | Update organization profile (`UpdateOrganizationDto`). |
| `GET` | `/organizer/organization/members?orgId={organizationId}` | List team members with roles. |
| `POST` | `/organizer/organization/members?orgId={organizationId}` | Invite/add a team member (`AddMemberDto`). |
| `PATCH` | `/organizer/organization/members/{memberId}?orgId={organizationId}` | Change a member’s role (`UpdateMemberRoleDto`). |
| `DELETE` | `/organizer/organization/members/{memberId}?orgId={organizationId}` | Remove a member. |

### Update Organization Example

```json
PATCH /organizer/organization?orgId=org_123
{
  "name": "Acme Events",
  "website": "https://acmeevents.example",
  "supportEmail": "support@acmeevents.example"
}
```

### Add Member Example

```json
POST /organizer/organization/members?orgId=org_123
{
  "userId": "usr_987",
  "role": "manager"
}
```

Responses mirror those from the public Organizations controller and include membership role, timestamps, and audit metadata. Role enforcement is handled server-side, returning HTTP `403` for insufficient privileges.
