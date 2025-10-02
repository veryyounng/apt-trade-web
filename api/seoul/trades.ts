// api/seoul/trades.ts
import type { IncomingMessage, ServerResponse } from 'http';

const toNum = (v: any) =>
  v == null
    ? 0
    : typeof v === 'number'
    ? v
    : Number(String(v).replace(/,/g, '')) || 0;

const toDate = (yyyymmdd?: string) =>
  !yyyymmdd || yyyymmdd.length !== 8
    ? ''
    : `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;

export default async function handler(req: any, res: any) {
  try {
    const KEY = process.env.SEOUL_SERVICE_KEY;
    if (!KEY) {
      return res
        .status(500)
        .json({ message: 'SEOUL_SERVICE_KEY missing in env' });
    }

    const page = Number((req.query.page as string) ?? '1');
    const size = Number((req.query.size as string) ?? '10');
    const start = (page - 1) * size + 1;
    const end = page * size;

    const rcptYr = (req.query.rcptYr as string | undefined)?.slice(0, 4) ?? '';
    const cggCd = (req.query.cggCd as string | undefined) ?? '';

    const segs = [String(start), String(end)];
    if (rcptYr) segs.push(rcptYr);
    if (cggCd) segs.push(cggCd);

    const url = `http://openapi.seoul.go.kr:8088/${KEY}/json/tbLnOpendataRtmsV/${segs.join(
      '/'
    )}/`;

    const r = await fetch(url, {
      headers: { Accept: 'application/json' },
      // Vercel 함수는 기본 타임아웃 10초 내외 → 요청 가볍게
      cache: 'no-store',
    });

    const data = await r.json().catch(() => ({} as any));
    const box = (data as any)?.tbLnOpendataRtmsV;

    if (!box) {
      return res
        .status(502)
        .json({ message: 'Malformed upstream', upstream: data });
    }
    if (box.RESULT?.CODE && box.RESULT.CODE !== 'INFO-000') {
      return res
        .status(502)
        .json({ message: 'Seoul API error', result: box.RESULT });
    }

    const rows = box.row ?? [];
    const items = rows.map((r: any) => ({
      aptSeq: `${r.CGG_CD}-${r.STDG_CD}-${r.MNO}-${r.SNO}-${r.CTRT_DAY}`,
      aptNm: String(r.BLDG_NM ?? ''),
      dealYmd: toDate(r.CTRT_DAY),
      dealAmountManwon: toNum(r.THING_AMT),
      excluUseAr: toNum(r.ARCH_AREA),
      floor: toNum(r.FLR),
      dealingGbn: r.DCLR_SE ?? '',
      buildYear: r.ARCH_YR ? Number(r.ARCH_YR) : 0,
      umdNm: String(r.STDG_NM ?? ''),
      roadNm: `${r.CGG_NM} ${r.STDG_NM}`.trim(),
      jibun: [r.MNO, r.SNO].filter(Boolean).join('-'),
    }));

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      page,
      totalCount: Number(box.list_total_count ?? items.length) || items.length,
      items,
    });
  } catch (e: any) {
    return res
      .status(500)
      .json({ message: 'Serverless error', detail: e?.message || String(e) });
  }
}
