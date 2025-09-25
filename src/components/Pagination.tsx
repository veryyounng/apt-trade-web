interface Props {
  page: number;
  total: number;
  size: number;
  onPage: (p: number) => void;
}

export default function Pagination({ page, total, size, onPage }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / size));
  return (
    <div>
      <button disabled={page <= 1} onClick={() => onPage(page - 1)}>
        이전
      </button>
      <span>
        {page} / {totalPages}
      </span>
      <button disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
        다음
      </button>
    </div>
  );
}
