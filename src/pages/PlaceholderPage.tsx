import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <EmptyState title={`${title} foundation ready`} description="This module is connected to the shared application shell and is ready to be designed next." />
    </>
  );
}
