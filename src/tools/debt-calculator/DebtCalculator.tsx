import { useMemo, useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useRouter } from '../../app/Router';
import './DebtCalculator.css';

function formatMoney(amount: number): string {
  if (!Number.isFinite(amount)) return '$0.00';
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatMonths(months: number): string {
  const years = Math.floor(months / 12);
  const rem = Math.round(months % 12);
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} yr${years === 1 ? '' : 's'}`);
  if (rem > 0 || years === 0) parts.push(`${rem} mo${rem === 1 ? '' : 's'}`);
  return parts.join(' ');
}

export function DebtCalculator() {
  const { back } = useRouter();
  const [principalText, setPrincipalText] = useState('');
  const [rateText, setRateText] = useState('');
  const [paymentText, setPaymentText] = useState('');

  const principal = parseFloat(principalText) || 0;
  const annualRate = parseFloat(rateText) || 0;
  const payment = parseFloat(paymentText) || 0;

  const result = useMemo(() => {
    if (principal <= 0 || payment <= 0) return null;
    const monthlyRate = annualRate / 100 / 12;

    if (monthlyRate === 0) {
      const months = principal / payment;
      return { months, totalPaid: principal, totalInterest: 0, tooLow: false };
    }

    const minInterestPayment = principal * monthlyRate;
    if (payment <= minInterestPayment) {
      return { months: Infinity, totalPaid: Infinity, totalInterest: Infinity, tooLow: true };
    }

    const months = -Math.log(1 - (principal * monthlyRate) / payment) / Math.log(1 + monthlyRate);
    const totalPaid = months * payment;
    const totalInterest = totalPaid - principal;
    return { months, totalPaid, totalInterest, tooLow: false };
  }, [principal, annualRate, payment]);

  return (
    <div className="screen">
      <ScreenHeader title="Debt Calculator" onBack={back} />

      <div className="dc__body">
        <div className="dc__field">
          <label className="dc__label">Debt Amount</label>
          <div className="dc__amount-row">
            <span className="dc__currency">$</span>
            <input
              className="dc__amount-input"
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={principalText}
              onChange={(e) => setPrincipalText(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="dc__field">
          <label className="dc__label">Annual Interest Rate</label>
          <div className="dc__amount-row">
            <input
              className="dc__amount-input"
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={rateText}
              onChange={(e) => setRateText(e.target.value)}
            />
            <span className="dc__suffix">%</span>
          </div>
        </div>

        <div className="dc__field">
          <label className="dc__label">Monthly Payment</label>
          <div className="dc__amount-row">
            <span className="dc__currency">$</span>
            <input
              className="dc__amount-input"
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={paymentText}
              onChange={(e) => setPaymentText(e.target.value)}
            />
          </div>
        </div>

        {result?.tooLow && (
          <p className="dc__warning">
            This payment doesn't cover the interest — the debt will never be paid off. Increase the monthly payment.
          </p>
        )}

        {result && !result.tooLow && (
          <div className="dc__result">
            <div className="dc__result-row dc__result-row--highlight">
              <span>Time to Pay Off</span>
              <span>{formatMonths(result.months)}</span>
            </div>
            <div className="dc__result-row">
              <span>Total Paid</span>
              <span>{formatMoney(result.totalPaid)}</span>
            </div>
            <div className="dc__result-row">
              <span>Total Interest</span>
              <span>{formatMoney(result.totalInterest)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
