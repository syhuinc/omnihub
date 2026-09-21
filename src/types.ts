import type { IconName } from './components/Icon';

export type ToolCategory = 'essentials' | 'productivity' | 'finance' | 'more';

export interface ToolMeta {
  id: string;
  name: string;
  shortDescription: string;
  category: ToolCategory;
  color: string;
  icon: IconName;
  keywords: string[];
}
