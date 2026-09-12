import { MockDataBadge } from '@/components/common/MockDataBadge';
import { ASSUMPTION_NOTES } from '@/lib/constants/assumptions';
import { formatKRW } from '@/lib/format';
import type { Company } from '@/types';

/**
 * 선택한 회사의 공시 정보.
 *
 * 평균급여는 "참고 정보"로만 보여준다. 개인의 예상 연봉으로 자동 적용하지 않으며
 * (도메인 경고 #2), 평균급여를 노출하는 이상 주의 문구를 반드시 함께 띄운다.
 */
export function CompanyInfoCard({ company }: { company: Company }) {
  return (
    <div className="bg-muted/40 space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{company.name}</span>
        {company.isMock && <MockDataBadge />}
      </div>

      <dl className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground text-xs">1인 평균 급여액</dt>
          <dd className="mt-0.5 font-medium">
            {company.averageSalary ? formatKRW(company.averageSalary) : '-'}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">평균 근속연수</dt>
          <dd className="mt-0.5 font-medium">
            {company.averageTenure ? `${company.averageTenure}년` : '-'}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">직원 수</dt>
          <dd className="mt-0.5 font-medium">
            {company.employeeCount
              ? `${company.employeeCount.toLocaleString('ko-KR')}명`
              : '-'}
          </dd>
        </div>
      </dl>

      <p className="text-muted-foreground text-xs leading-relaxed">
        {ASSUMPTION_NOTES.companyAverage}
        {company.dataYear ? ` (${company.dataYear}년 공시 기준)` : ''}
      </p>
    </div>
  );
}
