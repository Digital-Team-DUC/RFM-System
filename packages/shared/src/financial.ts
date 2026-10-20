import { Currency, InstallmentStatus } from './enums';
import { InstallmentScheduleRow } from './types';

/**
 * Decimal safe rounding to 2 decimal places (standard for financial values)
 */
export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Currency formatting helper for USD and KHR
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency: Currency = Currency.USD
): string {
  const numeric = typeof amount === 'number' ? amount : Number(amount) || 0;
  if (currency === Currency.KHR) {
    return new Intl.NumberFormat('km-KH', {
      style: 'currency',
      currency: 'KHR',
      maximumFractionDigits: 0,
    }).format(numeric);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);
}

/**
 * Generate installment schedule reconciling precisely to total contract principal minus initial deposit
 * The final installment handles any cent rounding discrepancy so total equals exactly contractual total.
 */
export function generateInstallmentSchedule(
  totalPrincipal: number,
  depositAmount: number,
  installmentCount: number,
  firstDueDate: Date,
  frequencyMonths: number = 1
): InstallmentScheduleRow[] {
  const remainingPrincipal = round2(totalPrincipal - depositAmount);
  if (installmentCount <= 0 || remainingPrincipal <= 0) {
    return [];
  }

  const rawPerInstallment = round2(remainingPrincipal / installmentCount);
  const rows: InstallmentScheduleRow[] = [];
  let allocatedTotal = 0;

  for (let i = 1; i <= installmentCount; i++) {
    const isFinal = i === installmentCount;
    // Final installment adjusts for any fraction-of-cent rounding variance
    const scheduledAmount = isFinal
      ? round2(remainingPrincipal - allocatedTotal)
      : rawPerInstallment;

    allocatedTotal = round2(allocatedTotal + scheduledAmount);

    const dueDate = new Date(firstDueDate);
    dueDate.setMonth(dueDate.getMonth() + (i - 1) * frequencyMonths);

    rows.push({
      installmentNumber: i,
      dueDate: dueDate.toISOString().split('T')[0],
      scheduledAmount,
      amountPaid: 0,
      outstandingAmount: scheduledAmount,
      latePenalty: 0,
      status: InstallmentStatus.UPCOMING,
    });
  }

  return rows;
}

/**
 * Calculate late payment penalty based on contract policy
 */
export interface PenaltyPolicyConfig {
  gracePeriodDays: number;
  dailyRatePercent: number; // e.g. 0.05% per day
  fixedFee: number;
  maxCapPercent: number; // e.g. 10% max of installment amount
}

export function calculateLatePenalty(
  outstandingAmount: number,
  dueDate: Date,
  currentDate: Date,
  policy: PenaltyPolicyConfig
): { isOverdue: boolean; overdueDays: number; penaltyAmount: number } {
  const diffTime = currentDate.getTime() - dueDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= policy.gracePeriodDays || outstandingAmount <= 0) {
    return { isOverdue: diffDays > 0, overdueDays: Math.max(0, diffDays), penaltyAmount: 0 };
  }

  const billableDays = diffDays - policy.gracePeriodDays;
  let penalty = policy.fixedFee + outstandingAmount * (policy.dailyRatePercent / 100) * billableDays;

  if (policy.maxCapPercent > 0) {
    const cap = outstandingAmount * (policy.maxCapPercent / 100);
    if (penalty > cap) {
      penalty = cap;
    }
  }

  return {
    isOverdue: true,
    overdueDays: diffDays,
    penaltyAmount: round2(penalty),
  };
}
