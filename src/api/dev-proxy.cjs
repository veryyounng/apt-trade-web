// src/api/dev-proxy.cjs  ← CommonJS 버전
const express = require('express');
const axios = require('axios');
const compression = require('compression');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.server' });

const app = express();
app.use(compression());
app.use(cors());

const PORT = 8083;
const SEOUL_KEY = process.env.SEOUL_SERVICE_KEY;
if (!SEOUL_KEY)
  console.error('⚠️ SEOUL_SERVICE_KEY 가 없습니다. .env.server 확인!');

const toNum = (v) =>
  v == null
    ? 0
    : typeof v === 'number'
    ? v
    : Number(String(v).replace(/,/g, '')) || 0;
const toDate = (yyyymmdd) =>
  !yyyymmdd || yyyymmdd.length !== 8
    ? ''
    : `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;

app.get('/api/seoul/trades', async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const size = Number(req.query.size || 10);
    const start = (page - 1) * size + 1;
    const end = page * size;

    const rcptYr = String(req.query.rcptYr || '').trim();
    const cggCd = String(req.query.cggCd || '').trim();

    const segs = [String(start), String(end)];
    if (rcptYr) segs.push(rcptYr);
    if (cggCd) segs.push(cggCd);

    const url = `http://openapi.seoul.go.kr:8088/${SEOUL_KEY}/json/tbLnOpendataRtmsV/${segs.join(
      '/'
    )}/`;
    console.log('➡️ [proxy→seoul]', url);

    const { data } = await axios.get(url, {
      responseType: 'json',
      timeout: 20000,
      headers: { 'Accept-Encoding': 'gzip, deflate, br' },
      validateStatus: () => true,
    });

    const box = data && data.tbLnOpendataRtmsV;
    if (!box)
      return res
        .status(502)
        .json({ message: 'Malformed Seoul API response', upstream: data });
    if (box.RESULT?.CODE && box.RESULT.CODE !== 'INFO-000') {
      return res
        .status(502)
        .json({ message: 'Seoul API 오류', result: box.RESULT });
    }

    const rows = box.row || [];
    const items = rows.map((r) => ({
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
    res.json({
      page,
      totalCount: Number(box.list_total_count ?? items.length) || items.length,
      items,
    });
  } catch (e) {
    console.error('Seoul proxy error:', e?.message || e);
    res
      .status(500)
      .json({ message: 'Seoul proxy failed', detail: e?.message || String(e) });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`dev-proxy listening on http://127.0.0.1:${PORT}`);
});
