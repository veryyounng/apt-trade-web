// src/api/trades.ts
import { api } from './client';
import type { TradeListResp, TradeQuery } from '../types';

export async function fetchTrades(params: TradeQuery): Promise<TradeListResp> {
  const sgg = params.sgg;
  const ym = params.ym; // YYYYMM
  const page = String(params.page ?? 1);
  const size = String(params.size ?? 10);

  // 🔑 키 정규화: 이미 %xx 패턴이 보이면 한 번 디코딩해서 이중인코딩 방지
  const rawKey = import.meta.env.VITE_RTMS_SERVICE_KEY as string;
  const serviceKey = /%[0-9A-Fa-f]{2}/.test(rawKey)
    ? decodeURIComponent(rawKey)
    : rawKey;

  // 어떤 경우 JSON, 어떤 경우 XML이 올 수 있으니 text로 받고 런타임 판별
  const { data: text } = await api.get<string>('/getRTMSDataSvcAptTradeDev', {
    params: {
      serviceKey,
      LAWD_CD: sgg,
      DEAL_YMD: ym,
      pageNo: page,
      numOfRows: size,
      // 일부 환경에서 _type=json을 지원함(미지원이어도 무해) → 가능하면 JSON 유도
      _type: 'json',
    },
    responseType: 'text',
  });

  // 공통 정규화 유틸
  const toInt = (s: string | number | undefined) =>
    s == null
      ? 0
      : typeof s === 'number'
      ? Math.trunc(s)
      : parseInt(String(s).replace(/,/g, ''), 10) || 0;
  const toFloat = (s: string | number | undefined) =>
    s == null ? 0 : typeof s === 'number' ? s : parseFloat(String(s)) || 0;

  // 1) JSON 응답 처리
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) {
    const json = JSON.parse(trimmed) as any;
    const header = json?.response?.header ?? {};
    const resultCode = header.resultCode;
    const resultMsg = header.resultMsg;

    if (resultCode && resultCode !== '000') {
      throw new Error(`RTMS API 실패: ${resultCode} ${resultMsg || ''}`.trim());
    }

    const itemsRaw = json?.response?.body?.items?.item;
    const arr: any[] = Array.isArray(itemsRaw)
      ? itemsRaw
      : itemsRaw
      ? [itemsRaw]
      : [];

    const items = arr.map((it) => {
      const y = String(it.dealYear ?? '').padStart(4, '0');
      const m = String(it.dealMonth ?? '').padStart(2, '0');
      const d = String(it.dealDay ?? '').padStart(2, '0');
      return {
        aptSeq: String(it.aptSeq ?? ''),
        aptNm: String(it.aptNm ?? ''),
        dealYmd: y && m && d ? `${y}-${m}-${d}` : '',
        dealAmountManwon: toInt(it.dealAmount),
        excluUseAr: toFloat(it.excluUseAr),
        floor: toInt(it.floor),
        dealingGbn: String(it.dealingGbn ?? ''),
        buildYear: toInt(it.buildYear),
        umdNm: String(it.umdNm ?? ''),
        roadNm: it.roadNm ? String(it.roadNm) : '',
        jibun: it.jibun ? String(it.jibun) : '',
      };
    });

    const totalCount =
      Number(json?.response?.body?.totalCount ?? items.length) || items.length;

    return {
      sgg,
      ym: `${ym.slice(0, 4)}-${ym.slice(4, 6)}`,
      page: Number(page),
      totalCount,
      items,
    };
  }

  // 2) XML 응답 처리
  const doc = new DOMParser().parseFromString(trimmed, 'application/xml');
  const parserErr = doc.getElementsByTagName('parsererror')[0];
  if (parserErr) {
    // XML도 아니고 JSON도 아니면 원문 앞 부분 찍고 실패
    console.error('RTMS raw head:', trimmed.slice(0, 300));
    throw new Error('RTMS 응답 파싱 실패(XML/JSON 아님)');
  }

  const pick = (tag: string, parent?: Element) =>
    (parent ?? doc).getElementsByTagName(tag)[0]?.textContent?.trim() ?? '';

  const resultCode = pick('resultCode');
  const resultMsg = pick('resultMsg');
  if (resultCode && resultCode !== '000') {
    throw new Error(`RTMS API 실패: ${resultCode} ${resultMsg || ''}`.trim());
  }

  const itemEls = Array.from(doc.getElementsByTagName('item'));
  const items = itemEls.map((el) => {
    const y = pick('dealYear', el).padStart(4, '0');
    const m = pick('dealMonth', el).padStart(2, '0');
    const d = pick('dealDay', el).padStart(2, '0');
    return {
      aptSeq: pick('aptSeq', el),
      aptNm: pick('aptNm', el),
      dealYmd: y && m && d ? `${y}-${m}-${d}` : '',
      dealAmountManwon: toInt(pick('dealAmount', el)),
      excluUseAr: toFloat(pick('excluUseAr', el)),
      floor: toInt(pick('floor', el)),
      dealingGbn: pick('dealingGbn', el),
      buildYear: toInt(pick('buildYear', el)),
      umdNm: pick('umdNm', el),
      roadNm: pick('roadNm', el),
      jibun: pick('jibun', el),
    };
  });

  const totalCount = Number(pick('totalCount') || items.length);

  return {
    sgg,
    ym: `${ym.slice(0, 4)}-${ym.slice(4, 6)}`,
    page: Number(page),
    totalCount,
    items,
  };
}
