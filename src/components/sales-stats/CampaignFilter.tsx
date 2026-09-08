import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { campaignsApi, type CampaignListItem } from '../../api/campaigns';
import { XIcon } from '../icons';

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
  const selectedCampaign = campaigns.find((c) => c.id === value);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <label htmlFor="campaign-filter" className="text-sm font-medium text-dark-300">
        {t('admin.salesStats.campaignFilter.label', 'Filter by campaign:')}
      </label>
      <div className="flex items-center gap-2">
        <select
          id="campaign-filter"
          value={value ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            onChange(val ? Number(val) : null);
          }}
          disabled={isLoading}
          className="flex-1 rounded-lg border border-dark-700 bg-dark-800 px-3 py-2 text-sm text-dark-100 transition-colors hover:border-dark-600 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500 disabled:opacity-50 sm:flex-initial sm:min-w-[280px]"
        >
          <option value="">
            {isLoading
              ? t('admin.salesStats.campaignFilter.loading', 'Loading...')
              : t('admin.salesStats.campaignFilter.allCampaigns', 'All campaigns')}
          </option>
          {campaigns.map((campaign: CampaignListItem) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.name}{' '}
              {!campaign.is_active ? `(${t('admin.campaigns.table.inactive', 'Inactive')})` : ''}
            </option>
          ))}
        </select>

        {value !== null && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-dark-700 bg-dark-800 text-dark-400 transition-colors hover:border-dark-600 hover:text-dark-100"
            title={t('admin.salesStats.campaignFilter.clear', 'Clear filter')}
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {selectedCampaign && (
        <div className="text-xs text-dark-400">
          {t('admin.salesStats.campaignFilter.selected', 'Showing data for campaign:')}{' '}
          <span className="font-medium text-dark-300">{selectedCampaign.name}</span>
        </div>
      )}
    </div>
  );
}
