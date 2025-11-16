import { Metadata } from 'next';
import { AuditLogList } from '@/components/admin/audit-logs';

export const metadata: Metadata = {
  title: 'Audit Logs',
  description: 'View platform audit logs',
};

export default function AuditLogsPage() {
  return <AuditLogList />;
}
