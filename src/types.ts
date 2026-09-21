import type { IconName } from './components/Icon';

export type ToolCategory = 'essentials' | 'productivity' | 'finance' | 'more';

/**
 * How a tool opens: 'sheet' slides up from the bottom (quick, one-off actions),
 * 'modal' opens centered (small focused calculators), 'page' pushes a full
 * page from the top like a normal screen (content-heavy, list-based tools).
 */
export type ToolPresentation = 'page' | 'sheet' | 'modal';

export interface ToolMeta {
  id: string;
  name: string;
  shortDescription: string;
  category: ToolCategory;
  color: string;
  icon: IconName;
  keywords: string[];
  presentation: ToolPresentation;
}
