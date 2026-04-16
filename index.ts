// Re-export the full public API from src/paye.ts
export {
  calculatePAYE,
  calculateMonthlyPayslip,
  calculatePayroll,
  formatCurrency,
  formatInput,
  type PayrollInput,
  type PayrollResult,
  type PAYEResult,
  type PayPeriod,
  type MonthlyPayslip,
} from './src/paye';
