'use client';

import { useEffect, useRef, useState } from 'react';
import { MockDataBadge } from '@/components/common/MockDataBadge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Company } from '@/types';

interface CompanySearchProps {
  label: string;
  /** 현재 선택/입력된 회사명 */
  value: string;
  onChange: (next: { company: Company | null; name: string }) => void;
  /** 목록에 없는 회사도 직접 입력할 수 있게 할지 */
  allowFreeText?: boolean;
  placeholder?: string;
  hint?: string;
  error?: string;
}

const DEBOUNCE_MS = 250;

export function CompanySearch({
  label,
  value,
  onChange,
  allowFreeText = false,
  placeholder = '회사명을 검색하세요',
  hint,
  error,
}: CompanySearchProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Company[]>([]);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 외부에서 값이 바뀌면 입력창도 따라간다
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // 바깥을 클릭하면 닫는다
  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoading(true);
      setFailed(false);
      try {
        const response = await fetch(
          `/api/companies?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error('search failed');
        const data = (await response.json()) as { companies: Company[] };
        setResults(data.companies ?? []);
      } catch (cause) {
        if (!controller.signal.aborted) {
          setFailed(true);
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, open]);

  function select(company: Company) {
    setQuery(company.name);
    setOpen(false);
    onChange({ company, name: company.name });
  }

  return (
    <div className="space-y-2" ref={containerRef}>
      <Label htmlFor="company-search">{label}</Label>

      <div className="relative">
        <Input
          id="company-search"
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            const next = event.target.value;
            setQuery(next);
            setOpen(true);
            // 직접 입력을 허용하면 타이핑도 값으로 인정한다
            if (allowFreeText) onChange({ company: null, name: next });
          }}
        />

        {open && (
          <div className="bg-popover absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border shadow-md">
            {isLoading && (
              <p className="text-muted-foreground px-3 py-2.5 text-sm">
                검색 중…
              </p>
            )}

            {!isLoading && failed && (
              <p className="text-muted-foreground px-3 py-2.5 text-sm">
                회사 목록을 불러오지 못했습니다.
                {allowFreeText && ' 회사명을 직접 입력해도 됩니다.'}
              </p>
            )}

            {!isLoading && !failed && results.length === 0 && (
              <p className="text-muted-foreground px-3 py-2.5 text-sm">
                검색 결과가 없습니다.
                {allowFreeText && ' 입력한 이름 그대로 사용됩니다.'}
              </p>
            )}

            {!isLoading &&
              results.map((company) => (
                <button
                  key={company.id}
                  type="button"
                  onClick={() => select(company)}
                  className="hover:bg-muted flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm"
                >
                  <span>{company.name}</span>
                  {company.isMock && <MockDataBadge />}
                </button>
              ))}
          </div>
        )}
      </div>

      {hint && !error && (
        <p className="text-muted-foreground text-xs">{hint}</p>
      )}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
