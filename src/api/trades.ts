import { api } from './client';
import type { TradeListResp, TradeQuery } from '../types';

export async function fetchTrades(params: TradeQuery): Promise<TradeListResp> {
  const page = Number(params.page ?? 1);
  const size = Number(params.size ?? 10);

  // 연도(YYYY)만 사용 (ym이 YYYYMM이어도 앞 4자리만 사용)
  // const rcptYr = params.ym ? params.ym.slice(0, 4) : undefined;

  const { data } = await api.get('/seoul/trades', {
    params: {
      page,
      size,
      rcptYr: params.ym?.slice(0, 4), // '2025'
      cggCd: params.sgg, // '11620' (관악구)
      _t: Date.now(), // 캐시 회피
    },
    timeout: 20000,
  });

  const ymOut =
    params.ym && params.ym.length >= 6
      ? `${params.ym.slice(0, 4)}-${params.ym.slice(4, 6)}`
      : data.items?.[0]?.dealYmd?.slice(0, 7) ?? '';

  return {
    sgg: params.sgg ?? '',
    ym: ymOut,
    page,
    totalCount: data.totalCount ?? data.items?.length ?? 0,
    items: data.items ?? [],
  };
}
