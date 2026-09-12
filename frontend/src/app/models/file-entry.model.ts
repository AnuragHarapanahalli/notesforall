import { FolderType } from './subject.model';

// FileEntry model matching backend FileEntryDTO
export interface FileEntry {
  id: number;
  subjectId: number;
  folderType: FolderType;
  originalFileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

export function getFileIcon(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  switch (ext) {
    case 'pdf': return '📄';
    case 'md':
    case 'markdown': return '📝';
    case 'docx':
    case 'doc': return '📃';
    case 'pptx':
    case 'ppt': return '📊';
    case 'txt': return '🗒️';
    default: return '📎';
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function getFileViewerType(fileName: string): 'pdf' | 'markdown' | 'docx' | 'ppt' | 'text' | 'other' {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'md' || ext === 'markdown') return 'markdown';
  if (ext === 'docx' || ext === 'doc') return 'docx';
  if (ext === 'pptx' || ext === 'ppt') return 'ppt';
  if (ext === 'txt') return 'text';
  return 'other';
}
