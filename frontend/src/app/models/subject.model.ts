// Subject model matching backend SubjectDTO
export interface Subject {
  id: number;
  name: string;
  description: string;
  code: string;
  isLive?: boolean; // true = Live (active), false = Deprecated (archived)
  live?: boolean;
  folders: { [key in FolderType]?: boolean }; // only non-empty folders present
}

export type FolderType = 'NOTES' | 'PYQS' | 'PPTS';

export const FOLDER_LABELS: Record<FolderType, string> = {
  NOTES: 'Notes',
  PYQS: 'Past Year Questions',
  PPTS: 'Presentations'
};

export const FOLDER_ICONS: Record<FolderType, string> = {
  NOTES: '📝',
  PYQS: '📋',
  PPTS: '📊'
};
