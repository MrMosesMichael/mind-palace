import { PageHeader } from '../components/layout/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';

interface StubPageProps {
  title: string;
  message?: string;
}

export function StubPage({ title, message }: StubPageProps) {
  return (
    <div>
      <PageHeader title={title} showBack />
      <EmptyState message={message ?? 'Coming soon. This room is being prepared.'} />
    </div>
  );
}
