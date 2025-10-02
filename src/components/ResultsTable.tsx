import { fmtAmt, fmtArea, fmtDate } from '../utils/format';
import type { TradeItem } from '../types';

export default function ResultsTable({ items }: { items: TradeItem[] }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>거래일</th>
          <th>단지명</th>
          <th>금액(만원)</th>
          <th>면적(m²)</th>
          <th>층</th>
          <th>거래유형</th>
          <th>주소</th>
        </tr>
      </thead>
      <tbody>
        {items.map((it) => {
          const rowKey = [
            it.aptSeq, // 단지/날짜
            it.floor, // 층
            it.excluUseAr, // 면적
            it.dealAmountManwon, // 금액
          ].join('|');

          return (
            <tr key={rowKey}>
              <td>{fmtDate(it.dealYmd)}</td>
              <td>{it.aptNm}</td>
              <td>{fmtAmt(it.dealAmountManwon)}</td>
              <td>{fmtArea(it.excluUseAr)}</td>
              <td>{it.floor}</td>
              <td>{it.dealingGbn}</td>
              <td>{[it.roadNm, it.jibun].filter(Boolean).join(' ')}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
