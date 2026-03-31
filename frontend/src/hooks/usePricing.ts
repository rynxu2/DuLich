import { useQuery, useMutation } from '@tanstack/react-query';
import { pricingApi, PricePreviewParams } from '../api/pricing';

export function usePricingPreview(params: PricePreviewParams) {
  return useQuery({
    queryKey: ['pricePreview', params],
    queryFn: async () => {
      if (!params.tourId || !params.adults) return null;
      const res = await pricingApi.preview(params);
      return res.data;
    },
    // Only run the query if we have the minimum required params
    enabled: !!params.tourId && params.adults > 0,
    // Keep it relatively fresh since promos or rules could expire
    staleTime: 1000 * 60, // 1 minute
  });
}
