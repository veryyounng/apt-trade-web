import { useState } from 'react';
import type { TradeQuery } from '../types';

interface Props {
  defaultSgg?: string;
  onSearch: (q: TradeQuery) => void;
  loading?: boolean;
}

export default function SearchForm({ defaultSgg, onSearch, loading }: Props) {
  const [sgg, setSgg] = useState(defaultSgg ?? '41117');
  const [ym, setYm] = useState('202509');
  const [apt, setApt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      sgg,
      ym,
      apt: apt || undefined,
      page: 1,
      size: 10,
      sort: 'dealYmd,desc',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="box">
      <label>
        시군구코드{' '}
        <input value={sgg} onChange={(e) => setSgg(e.target.value)} />
      </label>
      <label>
        년월 <input value={ym} onChange={(e) => setYm(e.target.value)} />
      </label>
      <label>
        단지명 <input value={apt} onChange={(e) => setApt(e.target.value)} />
      </label>
      <button type="submit" disabled={loading}>
        검색
      </button>
    </form>
  );
}
