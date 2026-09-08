import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { campaignsApi, type CampaignListItem } from '../../api/campaigns';

interface CampaignFilterProps {
  value: number | null;
  onChange: (campaignId: number | null) => void;
}

export function CampaignFilter({ value, onChange }: CampaignFilterProps) {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-campaigns-filter'],
    queryFn: () => campaignsApi.getCampaigns(true, 0, 100),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const campaigns = data?.campaigns ?? [];

  return (
    <select
      id="campaign-filter"
      value={value ?? ''}
      onChange={(e) => {
        const val = e.target.value;
        onChange(val ? Number(val) : null);
      }}
      disabled={isLoading}
      className="w-full rounded-xl border border-dark-700 bg-dark-800 px-4 py-2.5 text-sm text-dark-100 transition-colors hover:border-dark-600 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20 disabled:opacity-50 sm:w-auto sm:min-w-[320px]"
    >
      <option value="">
        {isLoading
          ? t('admin.salesStats.campaignFilter.loading', 'Loading...')
          : t('admin.salesStats.campaignFilter.noCampaignFilter', '— Without campaign filter —')}
      </option>
      {campaigns.map((campaign: CampaignListItem) => (
        <option key={campaign.id} value={campaign.id}>
          {campaign.name}
          {!campaign.is_active ? ` (${t('admin.campaigns.table.inactive', 'Inactive')})` : ''}
        </option>
      ))}
    </select>
  );
}
