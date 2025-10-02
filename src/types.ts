export interface TradeQuery {
  sgg: string;
  ym: string;
  page?: number;
  size?: number;
  apt?: string;
  minArea?: number;
  maxArea?: number;
  minAmt?: number;
  maxAmt?: number;
  sort?: string;
  refresh?: boolean;
}

export interface TradeItem {
  aptSeq: string;
  aptNm: string;
  dealYmd: string;
  dealAmountManwon: number;
  excluUseAr: number;
  floor: number;
  dealingGbn: string;
  buildYear: number;
  umdNm: string;
  roadNm?: string;
  jibun?: string;
}

export interface TradeListResp {
  sgg: string;
  ym: string;
  page: number;
  totalCount: number;
  items: TradeItem[];
  sggName?: string;
}
