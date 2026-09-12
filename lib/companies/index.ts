import 'server-only';

import { createClient } from '@/lib/supabase/server';
import {
  COMPANY_COLUMNS,
  toCompany,
  type CompanyRow,
} from '@/lib/supabase/mappers';
import type { Company } from '@/types';
import { searchDartCompanies } from './dart';
import { searchMockCompanies } from './mock';

export type CompanySource = 'dart' | 'db' | 'mock';

export interface CompanySearchResult {
  companies: Company[];
  /** 어느 경로에서 왔는지. UI가 fallback 여부를 알 수 있어야 한다 */
  source: CompanySource;
}

const SEARCH_LIMIT = 20;

/**
 * 회사 검색.
 *
 * 우선순위: OpenDART → Supabase companies 테이블 → 인메모리 mock.
 * 어느 단계에서 실패해도 예외를 던지지 않는다. 검색이 앱을 멈추게 하면 안 된다.
 */
export async function searchCompanies(
  query: string,
): Promise<CompanySearchResult> {
  const fromDart = await searchDartCompanies(query).catch(() => null);
  if (fromDart && fromDart.length > 0) {
    return { companies: fromDart, source: 'dart' };
  }

  try {
    const supabase = await createClient();
    const trimmed = query.trim();

    let request = supabase.from('companies').select(COMPANY_COLUMNS);
    if (trimmed) request = request.ilike('name', `%${trimmed}%`);

    const { data, error } = await request
      .order('name', { ascending: true })
      .limit(SEARCH_LIMIT)
      .returns<CompanyRow[]>();

    if (!error && data) {
      return { companies: data.map(toCompany), source: 'db' };
    }
  } catch {
    // DB에 닿지 못하면 아래 mock으로 내려간다
  }

  return {
    companies: searchMockCompanies(query).slice(0, SEARCH_LIMIT),
    source: 'mock',
  };
}
