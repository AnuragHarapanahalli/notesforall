import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Subject, FolderType, FOLDER_LABELS, FOLDER_ICONS } from '../../models/subject.model';
import { FileEntry, getFileIcon, formatFileSize } from '../../models/file-entry.model';

@Component({
  selector: 'app-subject-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container subject-detail-container">

      <!-- Monospace Breadcrumbs -->
      <nav class="brutal-breadcrumbs">
        <a routerLink="/" class="crumb-link">[ REPO_ROOT ]</a>
        <span class="crumb-sep">/</span>
        <span class="crumb-active">{{ subject?.code || 'SUBJECT' }}</span>
      </nav>

      <!-- Subject Header Cell -->
      <header class="bento-cell subject-header-cell" *ngIf="subject">
        <div
          class="cell-top-bar"
          [class.bar-live]="isSubjectLive(subject)"
          [class.bar-deprecated]="!isSubjectLive(subject)"
        >
          <span class="status-tag">
            <span class="status-bullet">●</span>
            {{ isSubjectLive(subject) ? 'ACTIVELY MAINTAINED' : 'DEPRECATED' }}
          </span>
          <span class="window-title-mono">// {{ subject.code }}</span>
        </div>

        <div class="subject-header-body">
          <h1 class="subject-title">{{ subject.name }}</h1>
          <div class="subject-code-row">
            <span class="code-badge">{{ subject.code }}</span>
          </div>
          <p class="subject-desc">{{ subject.description || 'Verified lecture notes, past exam papers, and presentation resources.' }}</p>
        </div>
      </header>

      <!-- Status: Loading -->
      <div class="status-cell" *ngIf="loading">
        <div class="brutal-loader">[ LOADING_SUBJECT_INDEX... ]</div>
      </div>

      <!-- Status: Error -->
      <div class="status-cell error-cell" *ngIf="error && !loading">
        <p>⚠️ SUBJECT COULD NOT BE FOUND OR SERVER CONNECTION FAILED.</p>
        <a routerLink="/" class="btn btn-brutal">[ return to index ]</a>
      </div>

      <!-- Main Courseware Bento Grid -->
      <main class="subject-main-grid" *ngIf="subject && !loading">

        <!-- Folder Switcher Bento Strip -->
        <section class="folder-select-bar" *ngIf="availableFolders.length > 0">
          <span class="folder-bar-label">FOLDERS:</span>
          <div class="folder-buttons">
            <button
              class="folder-btn"
              *ngFor="let folder of availableFolders"
              [class.active]="activeFolder === folder"
              (click)="selectFolder(folder)"
            >
              <span>{{ folderIcons[folder] }}</span>
              <span>{{ folderLabels[folder] }}</span>
              <span class="folder-count-tag" *ngIf="activeFolder === folder">[{{ files.length }}]</span>
            </button>
          </div>
        </section>

        <!-- No Folders Available -->
        <div class="status-cell" *ngIf="availableFolders.length === 0">
          <p>[ NO STUDY MATERIALS PUBLISHED YET FOR THIS COURSE ]</p>
          <a routerLink="/" class="btn btn-brutal">[ return home ]</a>
        </div>

        <!-- Files Loading -->
        <div class="status-cell" *ngIf="filesLoading">
          <div class="brutal-loader">[ RETRIEVING_FOLDER_ENTRIES... ]</div>
        </div>

        <!-- Raw File Rows (Main Feed) -->
        <section class="files-feed-section" *ngIf="!filesLoading && files.length > 0">
          <div class="feed-header">
            <h2 class="cell-header">folder contents // {{ activeFolder }}</h2>
            <span class="count-tag">ENTRIES: {{ files.length }}</span>
          </div>

          <div class="file-table-brutal">
            <div
              class="file-row-brutal"
              *ngFor="let file of files"
            >
              <!-- Left: Extension badge and file title link -->
              <div class="file-identity">
                <span class="file-ext-box">{{ fileExtension(file.originalFileName) }}</span>
                <a
                  class="file-link-title"
                  [routerLink]="['/view', file.id]"
                  [queryParams]="{ folder: activeFolder }"
                >
                  {{ file.originalFileName }}
                </a>
              </div>

              <!-- Center: Monospace Metadata -->
              <div class="file-meta-mono">
                <span class="meta-size" *ngIf="file.fileSize">{{ getSize(file.fileSize) }}</span>
                <span class="meta-tag">[ VERIFIED ]</span>
              </div>

              <!-- Right: Mechanical Action Buttons -->
              <div class="file-actions">
                <!-- Dual download options for presentations -->
                <ng-container *ngIf="isPresentation(file.originalFileName)">
                  <a
                    [href]="api.getFileDownloadUrl(file.id, 'pptx')"
                    [download]="file.originalFileName"
                    class="btn-brutal btn-action-sm"
                    title="Download original PPTX"
                  >
                    ⬇ PPTX
                  </a>
                  <a
                    [href]="api.getFileDownloadUrl(file.id, 'pdf')"
                    [download]="getPdfName(file.originalFileName)"
                    class="btn-brutal btn-action-sm"
                    title="Download converted PDF"
                  >
                    ⬇ PDF
                  </a>
                </ng-container>

                <!-- Single download for other files -->
                <a
                  *ngIf="!isPresentation(file.originalFileName)"
                  [href]="api.getFileDownloadUrl(file.id)"
                  [download]="file.originalFileName"
                  class="btn-brutal btn-action-sm"
                  title="Direct download file"
                >
                  ⬇ DOWNLOAD
                </a>

                <!-- Preview In Browser -->
                <a
                  [routerLink]="['/view', file.id]"
                  [queryParams]="{ folder: activeFolder }"
                  class="btn-brutal btn-preview-sm"
                >
                  VIEW →
                </a>
              </div>
            </div>
          </div>
        </section>

        <!-- Empty Folder State -->
        <div class="status-cell" *ngIf="!filesLoading && activeFolder && files.length === 0">
          <p>[ NO DOCUMENTS IN CURRENT FOLDER ]</p>
        </div>
      </main>

    </div>
  `,
  styles: [`
    .subject-detail-container {
      display: flex;
      flex-direction: column;
      gap: clamp(24px, 3.5vw, 32px);
    }

    /* Monospace Breadcrumbs */
    .brutal-breadcrumbs {
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: var(--font-mono);
      font-size: 0.85rem;
      font-weight: 800;
    }

    .crumb-link {
      color: var(--ink);
      text-decoration: none;
      padding: 3px 6px;
    }

    .crumb-link:hover {
      background: var(--yellow);
      color: #000000;
    }

    .crumb-sep {
      color: var(--muted);
    }

    .crumb-active {
      color: var(--blue-header);
    }

    /* Subject Header Cell */
    .subject-header-cell {
      padding: 0;
      overflow: hidden;
    }

    .cell-top-bar {
      border-bottom: var(--border-thin) solid var(--border);
      padding: 10px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: background-color 0.15s ease, color 0.15s ease;
    }

    .cell-top-bar.bar-live {
      background: var(--green);
      color: #000000;
    }

    .cell-top-bar.bar-deprecated {
      background: var(--red);
      color: #FFFFFF;
    }

    .status-tag {
      font-family: var(--font-mono);
      font-size: 0.82rem;
      font-weight: 900;
      letter-spacing: 0.06em;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .status-bullet {
      font-size: 0.85rem;
    }

    .window-title-mono {
      font-family: var(--font-mono);
      font-size: 0.82rem;
      font-weight: 900;
      letter-spacing: 0.04em;
    }

    .cell-top-bar.bar-live .window-title-mono {
      color: #000000;
    }

    .cell-top-bar.bar-deprecated .window-title-mono {
      color: #FFFFFF;
    }

    .subject-header-body {
      padding: clamp(24px, 3.5vw, 36px);
      display: flex;
      flex-direction: column;
      gap: 14px;
      background: var(--bg-card);
    }

    .subject-code-row {
      display: flex;
      align-items: center;
      margin-top: 2px;
      margin-bottom: 4px;
    }

    .code-badge {
      font-family: var(--font-mono);
      font-size: 0.85rem;
      font-weight: 900;
      background: var(--yellow);
      color: #000000;
      border: 2px solid var(--border);
      box-shadow: 2px 2px 0 var(--border);
      padding: 3px 12px;
    }

    .subject-title {
      font-size: clamp(2rem, 4vw, 3rem);
      font-weight: 900;
      letter-spacing: -0.03em;
      color: var(--ink);
      line-height: 1.2;
    }

    .subject-desc {
      font-size: 1rem;
      color: var(--muted);
      max-width: 920px;
      line-height: 1.6;
    }

    /* Main Courseware Grid Container */
    .subject-main-grid {
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    /* Folder Switcher Strip */
    .folder-select-bar {
      display: flex;
      align-items: center;
      gap: 16px;
      background: var(--bg-card);
      border: var(--border-thin) solid var(--border);
      box-shadow: 5px 5px 0 var(--border);
      padding: 14px 20px;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }

    .folder-bar-label {
      font-family: var(--font-mono);
      font-weight: 900;
      font-size: 0.88rem;
      color: var(--blue-header);
    }

    .folder-buttons {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .folder-btn {
      font-family: var(--font-mono);
      font-size: 0.88rem;
      font-weight: 800;
      padding: 10px 18px;
      background: var(--bg);
      color: var(--ink);
      border: 2px solid var(--border);
      box-shadow: 3px 3px 0 var(--border);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.08s ease;
    }

    .folder-btn:hover {
      background: var(--yellow);
      color: #000000;
      transform: translate(-1px, -1px);
      box-shadow: 4px 4px 0 var(--border);
    }

    .folder-btn.active {
      background: var(--ink);
      color: var(--bg);
    }

    .folder-btn.active .folder-count-tag {
      color: var(--yellow);
    }

    .folder-count-tag {
      font-size: 0.76rem;
      color: var(--muted);
    }

    /* Files Feed Section */
    .files-feed-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 10px;
    }

    .feed-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid var(--border);
      padding-bottom: 12px;
      margin-bottom: 4px;
    }

    .count-tag {
      font-family: var(--font-mono);
      font-size: 0.82rem;
      font-weight: 900;
      background: var(--ink);
      color: var(--yellow);
      padding: 4px 10px;
    }

    .file-table-brutal {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .file-row-brutal {
      background: var(--bg-card);
      border: var(--border-thin) solid var(--border);
      box-shadow: 5px 5px 0 var(--border);
      padding: 16px 22px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      flex-wrap: wrap;
      transition: transform 0.08s ease, box-shadow 0.08s ease;
    }

    .file-row-brutal:hover {
      background: var(--bg-card-hover);
      transform: translate(-1px, -1px);
      box-shadow: 7px 7px 0 var(--border);
    }

    .file-identity {
      display: flex;
      align-items: center;
      gap: 14px;
      flex: 1;
      min-width: 260px;
    }

    .file-ext-box {
      font-family: var(--font-mono);
      font-weight: 900;
      font-size: 0.74rem;
      background: var(--ink);
      color: var(--yellow);
      padding: 5px 9px;
      letter-spacing: 0.04em;
    }

    .file-link-title {
      font-family: var(--font-display);
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--ink);
      text-decoration: none;
      word-break: break-all;
    }

    .file-link-title:hover {
      color: var(--blue-header);
      text-decoration: underline;
    }

    .file-meta-mono {
      display: flex;
      align-items: center;
      gap: 14px;
      font-family: var(--font-mono);
      font-size: 0.8rem;
      font-weight: 800;
      color: var(--muted);
    }

    .file-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .btn-action-sm {
      padding: 8px 14px;
      font-size: 0.8rem;
      background: var(--bg-card);
      color: var(--ink);
      border: 2px solid var(--border);
      box-shadow: 2px 2px 0 var(--border);
      font-family: var(--font-mono);
      font-weight: 900;
      text-decoration: none;
      cursor: pointer;
    }

    .btn-action-sm:hover {
      background: var(--yellow);
      color: #000000;
    }

    .btn-preview-sm {
      padding: 8px 16px;
      font-size: 0.8rem;
      background: var(--harsh-orange);
      color: #FFFFFF;
      border: 2px solid var(--border);
      box-shadow: 3px 3px 0 var(--border);
      font-family: var(--font-mono);
      font-weight: 900;
      text-decoration: none;
      cursor: pointer;
    }

    .btn-preview-sm:hover {
      background: #E65100;
    }

    .status-cell {
      background: var(--bg-card);
      border: var(--border-width) solid var(--border);
      box-shadow: 6px 6px 0 var(--border);
      padding: 48px 24px;
      text-align: center;
      font-family: var(--font-mono);
      font-weight: 900;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 18px;
    }

    .error-cell {
      background: #FFF0F0;
      border-color: #CC0000;
      color: #CC0000;
    }
  `]
})
export class SubjectDetailComponent implements OnInit {
  subject: Subject | null = null;
  files: FileEntry[] = [];
  activeFolder: FolderType | null = null;
  availableFolders: FolderType[] = [];
  loading = true;
  filesLoading = false;
  error = false;

  readonly folderLabels = FOLDER_LABELS;
  readonly folderIcons = FOLDER_ICONS;

  constructor(
    private route: ActivatedRoute,
    public api: ApiService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadSubject(Number(id));
      }
    });
  }

  loadSubject(id: number): void {
    this.loading = true;
    this.error = false;
    this.api.getSubject(id).subscribe({
      next: (subj) => {
        this.subject = subj;
        this.loading = false;
        this.computeAvailableFolders();
        if (this.availableFolders.length > 0) {
          const queryFolder = this.route.snapshot.queryParamMap.get('folder') as FolderType;
          if (queryFolder && this.availableFolders.includes(queryFolder)) {
            this.selectFolder(queryFolder);
          } else {
            this.selectFolder(this.availableFolders[0]);
          }
        }
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  computeAvailableFolders(): void {
    if (!this.subject?.folders) {
      this.availableFolders = [];
      return;
    }
    const order: FolderType[] = ['NOTES', 'PYQS', 'PPTS'];
    this.availableFolders = order.filter(f => this.subject?.folders && this.subject.folders[f]);
  }

  selectFolder(folder: FolderType): void {
    this.activeFolder = folder;
    if (!this.subject) return;
    this.filesLoading = true;
    this.api.getFiles(this.subject.id, folder).subscribe({
      next: (files) => {
        this.files = files;
        this.filesLoading = false;
      },
      error: () => {
        this.files = [];
        this.filesLoading = false;
      }
    });
  }

  getIcon(fileName: string): string {
    return getFileIcon(fileName);
  }

  getSize(bytes: number): string {
    return formatFileSize(bytes);
  }

  fileExtension(fileName: string): string {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts.pop()!.toUpperCase() : 'DOC';
  }

  isPresentation(fileName: string): boolean {
    const lower = fileName.toLowerCase();
    return lower.endsWith('.pptx') || lower.endsWith('.ppt');
  }

  getPdfName(fileName: string): string {
    return fileName.replace(/\.[^/.]+$/, '.pdf');
  }

  isSubjectLive(s: Subject): boolean {
    if (s.isLive !== undefined && s.isLive !== null) return s.isLive;
    if (s.live !== undefined && s.live !== null) return s.live;
    return true;
  }
}