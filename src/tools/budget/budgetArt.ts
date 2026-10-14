import food from '../../assets/budget/food.webp';
import transport from '../../assets/budget/transport.webp';
import shopping from '../../assets/budget/shopping.webp';
import bills from '../../assets/budget/bills.webp';
import entertainment from '../../assets/budget/entertainment.webp';
import health from '../../assets/budget/health.webp';
import other from '../../assets/budget/other.webp';
import piggy from '../../assets/budget/piggy.webp';
import piggyGreen from '../../assets/budget/piggy-green.webp';
import wallet from '../../assets/budget/wallet.webp';
import target from '../../assets/budget/target.webp';
import chart from '../../assets/budget/chart.webp';
import laptop from '../../assets/budget/laptop.webp';
import island from '../../assets/budget/island.webp';
import calendar from '../../assets/budget/calendar.webp';
import documentArt from '../../assets/budget/document.webp';
import type { GoalIcon } from './budgetStore';

/** 3D art plus the tinted tile colour behind it, per expense category id. */
export const CATEGORY_ART: Record<string, { img: string; tile: string; tileLight: string }> = {
  food: { img: food, tile: '#33291f', tileLight: '#fdf0dc' },
  transport: { img: transport, tile: '#0c2c52', tileLight: '#e1edfd' },
  shopping: { img: shopping, tile: '#2b1c4f', tileLight: '#efe7fd' },
  bills: { img: bills, tile: '#3a1c25', tileLight: '#fde4e7' },
  entertainment: { img: entertainment, tile: '#3a1a35', tileLight: '#fde4f3' },
  health: { img: health, tile: '#0d3536', tileLight: '#dcf5f3' },
  other: { img: other, tile: '#3a321a', tileLight: '#fdf4d9' },
};

export const GOAL_ART: Record<GoalIcon, string> = {
  laptop,
  island,
  piggy,
  target,
  wallet,
  calendar,
  document: documentArt,
  chart,
};

export const ART = { piggy, piggyGreen, wallet, target, chart };
