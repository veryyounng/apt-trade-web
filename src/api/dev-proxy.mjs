import express from 'express';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.server' }); // ← 서버용 env 로드

const app = express();
const PORT = 8080;

// .env에 넣어둔 서비스키 읽기 (Vite용 env와는 별개로 개발 편의상 process.env 사용)
const SERVICE_KEY = process.env.RTMS_SERVICE_KEY; // 환경변수로 주입
if (!SERVICE_KEY) {
  console.warn('⚠️  RTMS_SERVICE_KEY가 설정되지 않았습니다. .env.server 확인!');
}

app.get('/api/trades', async (req, res) => {
  try {
    // 프론트 쿼리 → 정부 API 파라미터 매핑
    const sgg = req.query.sgg; // LAWD_CD
    const ym = req.query.ym; // DEAL_YMD (YYYYMM)
    const page = Number(req.query.page || 1);
    const size = Number(req.query.size || 10);

    if (!sgg || !ym) {
      return res
        .status(400)
        .json({ message: 'sgg(법정동 시군구코드)와 ym(YYYYMM)은 필수입니다.' });
    }

    const url =
      'https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev';
    const { data: xml } = await axios.get(url, {
      params: {
        serviceKey: SERVICE_KEY,
        LAWD_CD: sgg,
        DEAL_YMD: ym,
        pageNo: page,
        numOfRows: size,
      },
      timeout: 8000,
      responseType: 'text',
    });

    const parsed = await parseStringPromise(xml, {
      explicitArray: false,
      trim: true,
    });
    const body = parsed?.response?.body;
    const items = body?.items?.item
      ? Array.isArray(body.items.item)
        ? body.items.item
        : [body.items.item]
      : [];

    const toInt = (s) =>
      typeof s === 'string' ? parseInt(s.replace(/,/g, ''), 10) : Number(s);
    const toFloat = (s) => (s == null ? null : parseFloat(String(s)));

    const normItems = items.map((it) => {
      const y = String(it.dealYear || '').padStart(4, '0');
      const m = String(it.dealMonth || '').padStart(2, '0');
      const d = String(it.dealDay || '').padStart(2, '0');
      return {
        aptSeq: it.aptSeq,
        aptNm: it.aptNm,
        dealYmd: y && m && d ? `${y}-${m}-${d}` : null,
        dealAmountManwon: toInt(it.dealAmount),
        excluUseAr: toFloat(it.excluUseAr),
        floor: it.floor ? Number(it.floor) : null,
        dealingGbn: it.dealingGbn || null,
        buildYear: it.buildYear ? Number(it.buildYear) : null,
        umdNm: it.umdNm || null,
        roadNm: it.roadNm || null,
        jibun: it.jibun || null,
      };
    });

    const result = {
      sgg: String(sgg),
      ym: `${ym.slice(0, 4)}-${ym.slice(4, 6)}`,
      page,
      totalCount: body?.totalCount ? Number(body.totalCount) : normItems.length,
      items: normItems,
    };

    res.json(result);
  } catch (e) {
    console.error(e?.message || e);
    res
      .status(500)
      .json({ message: 'RTMS 프록시 오류', detail: e?.message || String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`dev-proxy listening on http://localhost:${PORT}`);
});
