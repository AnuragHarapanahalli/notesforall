import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Subject, FolderType } from '../models/subject.model';
import { FileEntry } from '../models/file-entry.model';

@Injectable({ providedIn: 'root' })
export class ApiService {

  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ─── Subjects (Public) ─────────────────────────────────────────────────────

  getSubjects(): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${this.base}/subjects`);
  }

  getSubject(id: number): Observable<Subject> {
    return this.http.get<Subject>(`${this.base}/subjects/${id}`);
  }

  // ─── Files (Public) ────────────────────────────────────────────────────────

  getFiles(subjectId: number, folderType: FolderType): Observable<FileEntry[]> {
    return this.http.get<FileEntry[]>(`${this.base}/subjects/${subjectId}/folders/${folderType}/files`);
  }

  getFileMetadata(fileId: number): Observable<FileEntry> {
    return this.http.get<FileEntry>(`${this.base}/files/${fileId}/metadata`);
  }

  /** Returns the URL for inline file viewing — used in iframes / fetch */
  getFileViewUrl(fileId: number): string {
    return `${this.base}/files/${fileId}/view`;
  }

  /** Returns the direct download URL for files (with optional format e.g. pdf) */
  getFileDownloadUrl(fileId: number, format?: string): string {
    const query = format ? `?format=${encodeURIComponent(format)}` : '';
    return `${this.base}/files/${fileId}/download${query}`;
  }

  /** Fetch extracted Table of Contents / Outline / Slides */
  getFileToc(fileId: number): Observable<Array<{ label: string; pageNumber: number; level: number; anchor: string }>> {
    return this.http.get<Array<{ label: string; pageNumber: number; level: number; anchor: string }>>(`${this.base}/files/${fileId}/toc`);
  }

  /** Fetch file content as text (for Markdown rendering) */
  getFileAsText(fileId: number): Observable<string> {
    return this.http.get(`${this.base}/files/${fileId}/view`, { responseType: 'text' });
  }

  /** Fetch file as ArrayBuffer (for DOCX via mammoth) */
  getFileAsArrayBuffer(fileId: number): Observable<ArrayBuffer> {
    return this.http.get(`${this.base}/files/${fileId}/view`, { responseType: 'arraybuffer' });
  }

  // ─── Admin ─────────────────────────────────────────────────────────────────

  login(username: string, password: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.base}/auth/login`, { username, password });
  }

  createSubject(subject: Partial<Subject>): Observable<Subject> {
    return this.http.post<Subject>(`${this.base}/admin/subjects`, subject);
  }

  updateSubject(id: number, subject: Partial<Subject>): Observable<Subject> {
    return this.http.put<Subject>(`${this.base}/admin/subjects/${id}`, subject);
  }

  updateSubjectStatus(id: number, isLive: boolean): Observable<Subject> {
    return this.http.put<Subject>(`${this.base}/admin/subjects/${id}/status?isLive=${isLive}`, {});
  }

  deleteSubject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/subjects/${id}`);
  }

  uploadFile(subjectId: number, folderType: FolderType, file: File): Observable<FileEntry> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<FileEntry>(
      `${this.base}/admin/subjects/${subjectId}/folders/${folderType}/upload`,
      formData
    );
  }

  deleteFile(fileId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/files/${fileId}`);
  }

  // ─── Submissions & Contributions ──────────────────────────────────────────

  submitMaterial(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.base}/submissions`, formData);
  }

  getAdminSubmissions(status?: string): Observable<any[]> {
    const query = status ? `?status=${status}` : '';
    return this.http.get<any[]>(`${this.base}/admin/submissions${query}`);
  }

  getPendingSubmissionsCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.base}/admin/submissions/pending-count`);
  }

  approveSubmission(id: number): Observable<any> {
    return this.http.post<any>(`${this.base}/admin/submissions/${id}/approve`, {});
  }

  rejectSubmission(id: number, reason?: string): Observable<any> {
    return this.http.post<any>(`${this.base}/admin/submissions/${id}/reject`, { reason: reason || '' });
  }

  getSubmissionPreviewUrl(id: number): string {
    const token = localStorage.getItem('adminToken');
    const query = token ? `?token=${encodeURIComponent(token)}` : '';
    return `${this.base}/admin/submissions/${id}/preview${query}`;
  }
}
