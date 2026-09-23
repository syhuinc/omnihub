import { ScreenHeader } from '../components/ScreenHeader';
import { useRouter } from '../app/Router';
import { getToolById } from './registry';
import { Calculator } from './calculator/Calculator';
import { UnitConverter } from './unit-converter/UnitConverter';
import { Timer } from './timer/Timer';
import { Stopwatch } from './stopwatch/Stopwatch';
import { Notes } from './notes/Notes';
import { Checklist } from './checklist/Checklist';
import { ExpenseTracker } from './expense-tracker/ExpenseTracker';
import { Budget } from './budget/Budget';
import { TipCalculator } from './tip-calculator/TipCalculator';
import { SplitBill } from './split-bill/SplitBill';
import { AgeCalculator } from './age-date/AgeCalculator';
import { DateCalculator } from './age-date/DateCalculator';
import { RandomGenerator } from './random-generator/RandomGenerator';
import { Alarm } from './alarm/Alarm';
import { SleepMode } from './sleep-mode/SleepMode';
import { PercentageCalculator } from './percentage-calculator/PercentageCalculator';
import { ScientificCalculator } from './scientific-calculator/ScientificCalculator';
import { TimeZone } from './time-zone/TimeZone';
import { TimeDifference } from './time-difference/TimeDifference';
import { SubscriptionCalculator } from './subscription-calculator/SubscriptionCalculator';
import { DebtCalculator } from './debt-calculator/DebtCalculator';
import { Compass } from './compass/Compass';
import { Flashlight } from './flashlight/Flashlight';
import { QrScanner } from './qr-scanner/QrScanner';
import { BarcodeScannerTool } from './barcode-scanner/BarcodeScannerTool';

const TOOL_COMPONENTS: Record<string, React.ComponentType> = {
  calculator: Calculator,
  'unit-converter': UnitConverter,
  timer: Timer,
  stopwatch: Stopwatch,
  alarm: Alarm,
  'sleep-mode': SleepMode,
  notes: Notes,
  checklist: Checklist,
  'expense-tracker': ExpenseTracker,
  budget: Budget,
  'tip-calculator': TipCalculator,
  'split-bill': SplitBill,
  'age-calculator': AgeCalculator,
  'date-calculator': DateCalculator,
  'random-generator': RandomGenerator,
  'percentage-calculator': PercentageCalculator,
  'scientific-calculator': ScientificCalculator,
  'time-zone': TimeZone,
  'time-difference': TimeDifference,
  'subscription-calculator': SubscriptionCalculator,
  'debt-calculator': DebtCalculator,
  compass: Compass,
  flashlight: Flashlight,
  'qr-scanner': QrScanner,
  'barcode-scanner': BarcodeScannerTool,
};

export function ToolRoute({ toolId }: { toolId: string }) {
  const { navigate } = useRouter();
  const tool = getToolById(toolId);
  const ToolComponent = TOOL_COMPONENTS[toolId];

  if (!ToolComponent) {
    return (
      <div className="screen">
        <ScreenHeader title={tool?.name ?? 'Tool'} onBack={() => navigate('/tools')} />
        <div className="screen__empty">
          <p>This tool isn't built yet — coming very soon.</p>
        </div>
      </div>
    );
  }

  if (tool?.presentation === 'sheet') {
    return (
      <div className="tool-slide-in">
        <ToolComponent />
      </div>
    );
  }

  return <ToolComponent />;
}
