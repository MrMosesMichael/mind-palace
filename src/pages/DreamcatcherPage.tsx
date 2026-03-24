import { PageHeader } from '../components/layout/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { lore } from '../lib/lore';

export function DreamcatcherPage() {
  return (
    <div>
      <PageHeader
        title={lore.dreamcatcher.title}
        subtitle={lore.dreamcatcher.subtitle}
      />
      <EmptyState message={lore.dreamcatcher.emptyState} />
    </div>
  );
}
