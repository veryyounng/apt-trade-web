import { useEffect, useState } from 'react';
import SearchForm from './components/SearchForm';
import ResultsTable from './components/ResultsTable';
import Pagination from './components/Pagination';
import { fetchTrades } from './api/trades';
import type { TradeListResp, TradeQuery } from './types';

export default function App() {
  const defaultSgg = import.meta.env.VITE_DEFAULT_SGG || '11110';
  const [query, setQuery] = useState<TradeQuery>({
    sgg: defaultSgg,
    ym: '2025',
    page: 1,
    size: 10,
  });
  const [data, setData] = useState<TradeListResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchTrades(query)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [JSON.stringify(query)]);

  return (
    <div className="container">
      <h1>아파트 매매 실거래가 조회</h1>
      <SearchForm
        defaultSgg={defaultSgg}
        onSearch={setQuery}
        loading={loading}
      />
      {error && <div className="error">{error}</div>}
      <ResultsTable items={data?.items ?? []} />
      <Pagination
        page={query.page ?? 1}
        total={data?.totalCount ?? 0}
        size={query.size ?? 10}
        onPage={(p) => setQuery({ ...query, page: p })}
      />
    </div>
  );
}
