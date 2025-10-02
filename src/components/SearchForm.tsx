import { useState } from 'react';
import type { TradeQuery } from '../types';
import SggTable from './SggTable';

export default function SearchForm({
  defaultSgg,
  onSearch,
  loading,
}: {
  defaultSgg?: string;
  onSearch: (q: TradeQuery) => void;
  loading?: boolean;
}) {
  const [sgg, setSgg] = useState(defaultSgg ?? '11110');
  const [sggName, setSggName] = useState('종로구');
  const [ym, setYm] = useState('2025'); // 입력은 유지, 연도만 사용됨

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      sgg,
      ym, // ← fetchTrades에서 앞 4자리만 사용
      page: 1,
      size: 10,
      sort: 'dealYmd,desc',
    });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <form onSubmit={submit} className="box">
        {/* 코드는 숨기고 한글만 노출 */}
        <div style={{ marginBottom: 8 }}>
          <label>
            자치구
            <input value={sggName} readOnly />
          </label>
        </div>

        <label>
          년(YYYY)
          <input
            value={ym}
            onChange={(e) => setYm(e.target.value)}
            placeholder="2025"
          />
        </label>

        <button type="submit" disabled={loading}>
          검색
        </button>
      </form>

      <SggTable
        onPick={(code, name) => {
          setSgg(code);
          setSggName(name);
        }}
      />
    </div>
  );
}
