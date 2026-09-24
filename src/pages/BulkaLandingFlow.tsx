import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, useSearchParams } from 'react-router';
import { landingApi } from '@/api/landings';
import { BulkaCheckout } from '@/components/landings/bulka/BulkaCheckout';
import Layout from '@/components/layout/Layout';
import PageLoader from '@/components/common/PageLoader';
import { getApiErrorMessage } from '@/utils/api-error';

export default function BulkaLandingFlow() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const { i18n } = useTranslation();

  const {
    data: config,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['landing-config', slug, i18n.language],
    queryFn: () => {
      if (!slug) throw new Error('Missing landing slug');
      return landingApi.getConfig(slug, i18n.language);
    },
    enabled: !!slug,
    staleTime: 60_000,
    retry: 1,
  });

  if (!slug || isLoading) return <PageLoader variant="dark" />;

  if (error || !config) {
    return (
      <div className="min-h-viewport flex items-center justify-center px-4">
        <div className="landing-surface-primary max-w-md text-center">
          <h1 className="text-xl font-semibold text-dark-50">Не удалось загрузить лендинг</h1>
          <p className="mt-3 text-sm leading-relaxed text-dark-300">
            {getApiErrorMessage(error, 'Попробуйте обновить страницу ещё раз.')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Layout titleOverride={config.title} showLogo={false}>
      <BulkaCheckout
        slug={slug}
        initialIntent={searchParams.get('intent') === 'trial' ? 'trial' : 'purchase'}
      />
    </Layout>
  );
}
