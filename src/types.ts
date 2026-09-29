import type { IconName } from './components/Icon';

export type ToolCategory = 'essentials' | 'productivity' | 'finance' | 'more';

/**
 * How a tool opens: 'sheet' slides up from the bottom over a dimmed
 * backdrop (quick, one-off tools), 'page' pushes a full page like a
 * normal screen (content-heavy, list-based tools).
 */
export type ToolPresentation = 'page' | 'sheet';

export interface ToolMeta {
  id: string;
  name: string;
  shortDescription: string;
  category: ToolCategory;
  color: string;
  icon: IconName;
  keywords: string[];
  presentation: ToolPresentation;
  /** Shown in the grid with a lock badge; opening it shows a "locked" screen instead of the tool. */
  locked?: boolean;
}
