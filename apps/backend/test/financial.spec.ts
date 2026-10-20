import {
  generateInstallmentSchedule,
  calculateLatePenalty,
  round2,
  formatCurrency,
  Currency,
} from '@rfm/shared';

describe('Financial Engine & Invariants Tests', () => {
  describe('Installment Schedule Reconciliation & Rounding Invariant', () => {
    it('should reconcile exactly to contract principal minus deposit with zero rounding drift', () => {
      const totalPrincipal = 185000.0;
      const deposit = 35000.0;
      const installmentCount = 24;
      const firstDue = new Date('2026-11-01');

      const schedule = generateInstallmentSchedule(totalPrincipal, deposit, installmentCount, firstDue);

      expect(schedule).toHaveLength(24);

      // Invariant: sum of all scheduled installments must equal exactly remaining principal
      const remainingPrincipal = round2(totalPrincipal - deposit);
      const totalScheduled = round2(
        schedule.reduce((acc, row) => acc + row.scheduledAmount, 0)
      );

      expect(totalScheduled).toEqual(remainingPrincipal);
      expect(totalScheduled).toEqual(150000.0);
    });

    it('should absorb cent rounding variance in the final installment for odd divisions', () => {
      // 100,000 divided by 3 installments = 33,333.33, 33,333.33, and final 33,333.34
      const schedule = generateInstallmentSchedule(100000.0, 0, 3, new Date('2026-01-01'));
      expect(schedule).toHaveLength(3);
      expect(schedule[0].scheduledAmount).toEqual(33333.33);
      expect(schedule[1].scheduledAmount).toEqual(33333.33);
      expect(schedule[2].scheduledAmount).toEqual(33333.34);

      const total = round2(schedule.reduce((sum, r) => sum + r.scheduledAmount, 0));
      expect(total).toEqual(100000.0);
    });
  });

  describe('Late Payment Penalty Engine', () => {
    const policy = {
      gracePeriodDays: 7,
      dailyRatePercent: 0.05, // 0.05% per day
      fixedFee: 10.0, // $10 base fee
      maxCapPercent: 10.0, // max 10% of installment
    };

    it('should charge zero penalty within grace period', () => {
      const dueDate = new Date('2026-10-01');
      const currentDate = new Date('2026-10-06'); // 5 days late (within 7-day grace period)
      const result = calculateLatePenalty(5000.0, dueDate, currentDate, policy);

      expect(result.penaltyAmount).toEqual(0);
      expect(result.overdueDays).toEqual(5);
    });

    it('should calculate daily penalty after grace period expires', () => {
      const dueDate = new Date('2026-10-01');
      const currentDate = new Date('2026-10-18'); // 17 days late (10 billable days after 7-day grace period)
      const result = calculateLatePenalty(5000.0, dueDate, currentDate, policy);

      // daily fee: 5000 * 0.0005 * 10 = $25 + $10 fixed fee = $35
      expect(result.penaltyAmount).toEqual(35.0);
      expect(result.overdueDays).toEqual(17);
    });

    it('should enforce maximum penalty cap according to contract policy', () => {
      const dueDate = new Date('2026-01-01');
      const currentDate = new Date('2026-10-01'); // 273 days late
      const result = calculateLatePenalty(5000.0, dueDate, currentDate, policy);

      // max cap: 10% of $5,000 = $500
      expect(result.penaltyAmount).toEqual(500.0);
    });
  });

  describe('Currency Formatting', () => {
    it('should format USD and KHR properly', () => {
      expect(formatCurrency(1250.5, Currency.USD)).toContain('$1,250.50');
      const khrFormatted = formatCurrency(5125000, Currency.KHR);
      expect(khrFormatted).toContain('5,125,000');
    });
  });
});
