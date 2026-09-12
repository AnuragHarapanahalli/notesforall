import { FolderType } from './subject.model';

export type SubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Submission {
  id: number;
  subjectId: number;
  subjectName: string;
  subjectCode: string;
  folderType: FolderType;
  title: string;
  contributorName: string;
  contributorEmail?: string;
  originalFileName: string;
  fileType: string;
  fileSize: number;
  status: SubmissionStatus;
  reviewNotes?: string;
  submittedAt: string;
  reviewedAt?: string;
}
