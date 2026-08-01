import { useParams, useSearchParams } from 'react-router';
import { BulkaCheckout } from '@/components/landings/bulka/BulkaCheckout';

export default function BulkaLandingFlow() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  if (!slug) return null;
  return (
    <BulkaCheckout
      slug={slug}
      initialIntent={searchParams.get('intent') === 'trial' ? 'trial' : 'purchase'}
    />
  );
}
