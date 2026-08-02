import { useSearchParams } from 'react-router';
import { ConnectionExperience } from '@/components/connection/ConnectionExperience';

export default function Connection() {
  const [searchParams] = useSearchParams();
  const subscriptionId = searchParams.get('sub');
  return (
    <ConnectionExperience subscriptionId={subscriptionId ? Number(subscriptionId) : undefined} />
  );
}
