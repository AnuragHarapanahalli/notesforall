import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../../services/api.service';
import { FileEntry, getFileViewerType } from '../../models/file-entry.model';

interface TocItem {
  label: string;
  level: number;
  anchor: string;
}

@Component({
  selector: 'app-file-viewer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="viewer-layout">
      <!-- Loading State -->
      <div class="viewer-status" *ngIf="loading">
        <div class="spinner"></div>
        <p>Loading document...</p>
      </div>

      <!-- Error State -->
      <div class="viewer-status error-status" *ngIf="error && !loading">
        <p>⚠️ Failed to load document.</p>
        <a routerLink="/" class="btn btn-primary">Back to Home</a>
      </div>

      <!-- Main Container: 2 Distinct Bento Windows Side-by-Side -->
      <div class="viewer-workspace-dual" *ngIf="!loading && !error && fileEntry">

        <!-- ================= WINDOW 1: TABLE OF CONTENTS ================= -->
        <aside class="viewer-window toc-window" [class.open-mobile]="sidebarOpen">
          <!-- Window Top Bar -->
          <div class="mac-window-bar">
            <div class="traffic-dots">
              <span class="dot dot-red"></span>
              <span class="dot dot-yellow"></span>
              <span class="dot dot-green"></span>
            </div>
            <div class="window-center">
              <span class="window-title-tag">INDEX // TOC</span>
            </div>
            <button class="close-drawer-btn" (click)="sidebarOpen = false" title="Close Contents">✕</button>
          </div>

          <!-- TOC Sub-header -->
          <div class="viewer-subbar toc-subbar">
            <span class="toc-subbar-title">TABLE OF CONTENTS</span>
            <span class="toc-count-badge" *ngIf="toc.length > 0">{{ toc.length }} TOPICS</span>
          </div>

          <!-- TOC Scrollable Window Body -->
          <div class="toc-scroll-pane">
            <nav class="toc-nav" *ngIf="toc.length > 0">
              <button
                class="toc-node"
                *ngFor="let item of toc"
                [class.lvl-1]="item.level === 1"
                [class.lvl-2]="item.level === 2"
                [class.lvl-3]="item.level === 3"
                [class.active-anchor]="activeAnchor === item.anchor"
                (click)="scrollToAnchor(item.anchor)"
                [title]="'Jump to: ' + item.label"
              >
                <span class="toc-bullet" *ngIf="item.level > 1">•</span>
                <span class="toc-text">{{ item.label }}</span>
              </button>
            </nav>

            <!-- Metadata info if no TOC parsed -->
            <div class="toc-empty" *ngIf="toc.length === 0">
              <div class="doc-meta-card">
                <p class="meta-label">DOCUMENT DETAILS</p>
                <p class="meta-val"><strong>File:</strong> {{ fileEntry.originalFileName }}</p>
                <p class="meta-val"><strong>Folder:</strong> {{ folderLabel }}</p>
                <p class="meta-val" *ngIf="fileSize"><strong>Size:</strong> {{ fileSize }}</p>
                <div class="sidebar-download-wrap">
                  <a
                    [href]="api.getFileDownloadUrl(fileEntry.id)"
                    [download]="fileEntry.originalFileName"
                    class="download-action-btn sidebar-dl-btn"
                  >
                    ⬇ DOWNLOAD COPY
                  </a>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <!-- ================= WINDOW 2: DOCUMENT VIEWER ================= -->
        <main class="viewer-window doc-window">
          <!-- Reading Progress Bar -->
          <div class="reading-progress-track" (click)="onProgressClick($event)" title="Reading Progress — Click to seek">
            <div class="reading-progress-bar" [style.width.%]="scrollProgress"></div>
          </div>

          <!-- Document Window Top Bar -->
          <div class="mac-window-bar">
            <div class="traffic-dots">
              <span class="dot dot-red"></span>
              <span class="dot dot-yellow"></span>
              <span class="dot dot-green"></span>
            </div>

            <!-- Mobile Sidebar Toggle -->
            <button class="mobile-toc-btn" (click)="toggleSidebar()" title="Toggle Table of Contents">
              <span class="toc-icon">📑</span>
              <span class="toc-btn-text">Contents ({{ toc.length }})</span>
            </button>

            <!-- Centered Document Title -->
            <div class="window-center">
              <span class="file-name-title" [title]="fileEntry.originalFileName">{{ fileEntry.originalFileName }}</span>
              <span class="type-badge">{{ fileTypeLabel }}</span>
            </div>

            <!-- Right Window Actions: Downloads & Exit -->
            <div class="window-right">
              <!-- Dual Download Options for Presentations -->
              <ng-container *ngIf="isPresentation">
                <a
                  [href]="api.getFileDownloadUrl(fileEntry.id, 'pptx')"
                  [download]="fileEntry.originalFileName"
                  class="download-action-btn"
                  title="Download original PowerPoint presentation"
                >
                  <svg class="dl-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                    <path d="M8 2v9m0 0l-3-3m3 3l3-3M2 13h12" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span>PPTX</span>
                </a>
                <a
                  [href]="api.getFileDownloadUrl(fileEntry.id, 'pdf')"
                  [download]="pdfDownloadFileName"
                  class="download-action-btn dl-secondary"
                  title="Download converted PDF document"
                >
                  <svg class="dl-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                    <path d="M8 2v9m0 0l-3-3m3 3l3-3M2 13h12" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span>PDF</span>
                </a>
              </ng-container>

              <!-- Single Download for other files -->
              <a
                *ngIf="!isPresentation"
                [href]="api.getFileDownloadUrl(fileEntry.id)"
                [download]="fileEntry.originalFileName"
                class="download-action-btn"
                title="Download file to device"
              >
                <svg class="dl-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                  <path d="M8 2v9m0 0l-3-3m3 3l3-3M2 13h12" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>DOWNLOAD</span>
              </a>

              <!-- Pop out in dedicated tab for PDF / PPT -->
              <a
                *ngIf="viewerType === 'pdf' || viewerType === 'ppt'"
                [href]="rawViewUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="download-action-btn dl-secondary"
                title="Open document in a dedicated browser tab"
              >
                <svg class="dl-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                  <path d="M6 3h7v7M13 3L7 9" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M11 9.5V13H3V5h3.5" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>POP OUT</span>
              </a>

              <a
                [routerLink]="['/subject', fileEntry.subjectId]"
                [queryParams]="returnFolder ? { folder: returnFolder } : null"
                class="close-viewer-btn"
                title="Exit viewer"
              >
                ✕
              </a>
            </div>
          </div>

          <!-- Document Subbar: Breadcrumbs & Stats -->
          <div class="viewer-subbar">
            <nav class="breadcrumb">
              <a routerLink="/" class="b-link">HOME</a>
              <span class="b-sep">/</span>
              <a
                [routerLink]="['/subject', fileEntry.subjectId]"
                [queryParams]="returnFolder ? { folder: returnFolder } : null"
                class="b-link"
              >
                SUBJECT
              </a>
              <span class="b-sep">/</span>
              <a
                [routerLink]="['/subject', fileEntry.subjectId]"
                [queryParams]="returnFolder ? { folder: returnFolder } : null"
                class="b-link b-folder"
              >
                {{ folderLabel | uppercase }}
              </a>
              <span class="b-sep">/</span>
              <span class="b-current">{{ fileEntry.originalFileName }}</span>
            </nav>

            <!-- Stats -->
            <div class="doc-stats" *ngIf="wordCount > 0">
              <span class="stat-item">WORDS: {{ wordCount | number }}</span>
              <span class="stat-sep">//</span>
              <span class="stat-item">READ: {{ readTimeMinutes }} MIN</span>
              <span class="stat-sep" *ngIf="scrollProgress > 0">//</span>
              <span class="stat-item progress-val" *ngIf="scrollProgress > 0">{{ scrollProgress | number:'1.0-0' }}% READ</span>
            </div>
          </div>

          <!-- Document Scrollable Content Area -->
          <div class="document-viewport">
            <!-- PDF and Converted PPTX Presentation Document Viewer -->
            <div class="doc-frame-wrapper" *ngIf="viewerType === 'pdf' || viewerType === 'ppt'">
              <iframe
                #pdfFrame
                [src]="safeUrl"
                class="embedded-frame"
                frameborder="0"
                allowfullscreen
              ></iframe>
            </div>

            <!-- Markdown Viewer (Scrollable with TOC Anchors) -->
            <div
              #scrollContainer
              class="markdown-scroller"
              *ngIf="viewerType === 'markdown' || viewerType === 'text'"
              (scroll)="onScrollerScroll($event)"
            >
              <article class="markdown-sheet" [innerHTML]="renderedHtml"></article>
            </div>

            <!-- DOCX Viewer (Scrollable with Bound Image Dimensions) -->
            <div
              #scrollContainer
              class="markdown-scroller"
              *ngIf="viewerType === 'docx'"
              (scroll)="onScrollerScroll($event)"
            >
              <article class="markdown-sheet docx-sheet" [innerHTML]="renderedHtml"></article>
            </div>

            <!-- Fallback for other formats -->
            <div class="fallback-wrapper" *ngIf="viewerType === 'other'">
              <div class="fallback-card card">
                <p class="fallback-icon">📄</p>
                <h3>{{ fileEntry.originalFileName }}</h3>
                <p class="fallback-hint">This file format can be downloaded and opened with its native desktop application.</p>
                <div class="fallback-actions">
                  <a
                    [href]="api.getFileDownloadUrl(fileEntry.id)"
                    [download]="fileEntry.originalFileName"
                    class="btn btn-accent"
                  >
                    ⬇ Download File
                  </a>
                  <a
                    [routerLink]="['/subject', fileEntry.subjectId]"
                    [queryParams]="returnFolder ? { folder: returnFolder } : null"
                    class="btn btn-ghost"
                  >
                    Return to Subject
                  </a>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .viewer-layout {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: clamp(8px, 1.8vw, 20px) clamp(8px, 2vw, 24px) 24px;
    }

    .viewer-status {
      text-align: center;
      padding: 100px 20px;
      color: var(--muted);
      margin: auto;
    }

    .error-status {
      color: var(--red);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--border);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* 2 Distinct Bento Windows Layout */
    .viewer-workspace-dual {
      flex: 1;
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 16px;
      height: calc(100vh - clamp(95px, 12vw, 130px));
      min-height: 540px;
      position: relative;
    }

    /* Window Container (Applied to BOTH Windows) */
    .viewer-window {
      background: var(--bg-card);
      border: 3px solid #000000;
      box-shadow: 4px 4px 0 #000000;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
      height: 100%;
    }

    /* Table of Contents Window (Window 1) */
    .toc-window {
      min-width: 0;
      background: var(--bg-card);
      z-index: 10;
    }

    .window-title-tag {
      font-family: var(--font-mono);
      font-size: 0.76rem;
      font-weight: 900;
      letter-spacing: 0.05em;
      color: var(--ink);
    }

    .toc-subbar {
      background: var(--bg-elevated);
      border-bottom: 2px solid var(--border);
      padding: 8px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .toc-subbar-title {
      font-family: var(--font-mono);
      font-size: 0.74rem;
      font-weight: 900;
      letter-spacing: 0.08em;
      color: var(--ink);
    }

    .toc-count-badge {
      font-family: var(--font-mono);
      font-size: 0.7rem;
      font-weight: 900;
      background: var(--yellow);
      color: #000000;
      border: 1.5px solid #000000;
      padding: 1px 6px;
    }

    /* TOC Scroll Pane: completely independent scrollbar */
    .toc-scroll-pane {
      flex: 1;
      overflow-y: auto;
      padding: 10px 12px 30px;
    }

    .toc-nav {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .toc-node {
      text-align: left;
      background: var(--bg);
      border: 2px solid var(--border);
      box-shadow: 2px 2px 0 var(--border);
      padding: 8px 10px;
      font-family: var(--font-mono);
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--ink);
      cursor: pointer;
      display: flex;
      align-items: flex-start;
      gap: 8px;
      transition: all 0.08s ease;
      line-height: 1.35;
      width: 100%;
      user-select: none;
    }

    .toc-node:hover {
      background: var(--yellow);
      color: #000000;
      border-color: #000000;
      transform: translate(-1px, -1px);
      box-shadow: 3px 3px 0 #000000;
    }

    .toc-node.active-anchor {
      background: var(--yellow) !important;
      color: #000000 !important;
      border: 2px solid #000000 !important;
      box-shadow: 3px 3px 0 #000000 !important;
      font-weight: 900 !important;
    }

    .toc-node.lvl-1 {
      font-weight: 900;
    }

    .toc-node.lvl-2 {
      margin-left: 12px;
      width: calc(100% - 12px);
      font-size: 0.76rem;
      background: var(--bg-card);
    }

    .toc-node.lvl-3 {
      margin-left: 22px;
      width: calc(100% - 22px);
      font-size: 0.72rem;
      background: var(--bg-card);
    }

    .toc-bullet {
      color: var(--harsh-orange);
      font-weight: 900;
    }

    .toc-node.active-anchor .toc-bullet {
      color: #000000;
    }

    .toc-text {
      flex: 1;
      word-break: break-word;
    }

    .toc-empty {
      padding: 10px 4px;
    }

    .doc-meta-card {
      background: var(--bg-elevated);
      border: 2px solid var(--border);
      box-shadow: 2px 2px 0 var(--border);
      padding: 14px;
      font-size: 0.8rem;
    }

    /* Document Window (Window 2) */
    .doc-window {
      min-width: 0;
    }

    /* Interactive Slim Progress Bar */
    .reading-progress-track {
      width: 100%;
      height: 4px;
      background: var(--bg);
      border-bottom: 1px solid var(--border);
      cursor: pointer;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      z-index: 20;
    }

    .reading-progress-bar {
      height: 100%;
      background: var(--harsh-orange);
      width: 0%;
      transition: width 0.1s ease-out;
    }

    .mac-window-bar {
      justify-content: space-between;
      padding: 10px 16px;
      border-bottom: 2px solid var(--border);
    }

    .window-center {
      display: flex;
      align-items: center;
      gap: 10px;
      max-width: 55%;
      overflow: hidden;
    }

    .file-name-title {
      font-size: 0.88rem;
      font-weight: 600;
      color: #000000;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .type-badge {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      font-weight: 900;
      color: #000000;
      background: var(--yellow);
      border: 1.5px solid #000000;
      padding: 2px 8px;
      flex-shrink: 0;
    }

    .window-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .download-action-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--bg-card);
      border: 2px solid var(--border);
      box-shadow: 2px 2px 0 var(--border);
      padding: 5px 12px;
      font-family: var(--font-mono);
      font-size: 0.78rem;
      font-weight: 800;
      color: var(--ink);
      text-decoration: none;
      transition: all 0.08s ease;
    }

    .download-action-btn:hover {
      background: var(--yellow);
      color: #000000;
      transform: translate(-1px, -1px);
      box-shadow: 3px 3px 0 var(--border);
    }

    .download-action-btn:active {
      transform: translate(1px, 1px);
      box-shadow: 1px 1px 0 var(--border);
    }

    .download-action-btn.dl-secondary {
      background: var(--harsh-orange);
      color: #FFFFFF;
      border-color: var(--border);
    }

    .download-action-btn.dl-secondary:hover {
      background: #E65100;
      color: #FFFFFF;
    }

    .dl-icon {
      width: 13px;
      height: 13px;
    }

    .close-viewer-btn {
      color: var(--ink);
      background: var(--bg-card);
      border: 2px solid var(--border);
      box-shadow: 2px 2px 0 var(--border);
      font-family: var(--font-mono);
      font-size: 0.85rem;
      font-weight: 900;
      padding: 4px 10px;
      transition: all 0.08s ease;
      text-decoration: none;
    }

    .close-viewer-btn:hover {
      background: var(--red);
      color: #FFFFFF;
    }

    .close-viewer-btn:active {
      transform: translate(1px, 1px);
      box-shadow: 1px 1px 0 var(--border);
    }

    .mobile-toc-btn {
      display: none;
      align-items: center;
      gap: 6px;
      background: var(--bg-card);
      border: 2px solid var(--border);
      box-shadow: 2px 2px 0 var(--border);
      padding: 4px 10px;
      color: var(--ink);
      cursor: pointer;
      font-size: 0.78rem;
      font-family: var(--font-mono);
      font-weight: 800;
    }

    /* Sub-bar breadcrumb and stats */
    .viewer-subbar {
      background: var(--bg-card);
      border-bottom: 1px solid var(--border);
      padding: 6px 16px;
      font-size: 0.78rem;
      color: var(--muted);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
      overflow-x: auto;
    }

    .b-link {
      color: var(--muted);
      text-decoration: underline;
      text-decoration-color: var(--border);
    }

    .b-link:hover {
      color: var(--ink);
    }

    .b-sep {
      opacity: 0.4;
    }

    .b-folder {
      color: var(--accent);
      font-weight: 500;
    }

    .b-current {
      color: var(--ink);
      font-weight: 500;
    }

    .doc-stats {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.76rem;
      color: var(--text);
    }

    .stat-sep {
      color: var(--muted);
      opacity: 0.5;
    }

    .progress-val {
      color: var(--accent-bright);
      font-weight: 600;
      font-family: var(--font-mono);
    }

    /* Document Viewport */
    .document-viewport {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      background: var(--bg);
      position: relative;
    }

    .doc-frame-wrapper {
      width: 100%;
      height: 100%;
      flex: 1;
      position: relative;
      background: #18181b;
      contain: content;
      transform: translateZ(0);
    }

    .embedded-frame {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
      contain: content;
    }

    /* Markdown & DOCX Scroller */
    .markdown-scroller {
      flex: 1;
      overflow-y: auto;
      scroll-behavior: smooth;
      padding: clamp(16px, 4vw, 48px) clamp(16px, 4vw, 44px);
      display: flex;
      justify-content: center;
    }

    .markdown-sheet {
      width: 100%;
      max-width: 860px;
      color: var(--text);
      font-size: clamp(15px, 1.6vw, 16.5px);
      line-height: 1.75;
      user-select: text;
    }

    .markdown-sheet :global(h1),
    .markdown-sheet :global(h2),
    .markdown-sheet :global(h3),
    .markdown-sheet :global(h4) {
      font-family: var(--font-serif);
      color: var(--ink);
      font-weight: 700;
      margin-top: 1.6em;
      margin-bottom: 0.6em;
      line-height: 1.2;
      scroll-margin-top: 30px;
    }

    .markdown-sheet :global(h1) { font-size: clamp(26px, 3.5vw, 36px); }
    .markdown-sheet :global(h2) { font-size: clamp(20px, 2.5vw, 28px); }
    .markdown-sheet :global(h3) { font-size: clamp(17px, 2vw, 22px); }

    .markdown-sheet :global(p) {
      margin-bottom: 1.2em;
    }

    /* Strict image boundary constraint for DOCX and Markdown */
    .markdown-sheet :global(img),
    .docx-sheet :global(img) {
      max-width: 100% !important;
      height: auto !important;
      object-fit: contain !important;
      display: block;
      margin: 1.8rem auto;
      box-shadow: 4px 4px 0 #000000;
      border: 2px solid #000000;
    }

    .markdown-sheet :global(code) {
      font-family: var(--font-mono);
      background: var(--bg-card);
      border: 1px solid var(--border);
      color: var(--ink);
      padding: 2px 6px;
      font-size: 0.88em;
    }

    .markdown-sheet :global(pre) {
      background: var(--bg-elevated);
      border: 2px solid var(--border);
      box-shadow: 2px 2px 0 var(--border);
      padding: 16px 20px;
      margin: 1.4em 0;
      overflow-x: auto;
    }

    .markdown-sheet :global(pre code) {
      background: transparent;
      border: none;
      padding: 0;
      color: var(--ink);
    }

    .markdown-sheet :global(blockquote) {
      border-left: 4px solid var(--accent);
      background: var(--bg-elevated);
      padding: 14px 20px;
      margin: 1.4em 0;
      color: var(--text);
    }

    .markdown-sheet :global(table) {
      border-collapse: collapse;
      width: 100%;
      margin: 1.4em 0;
      font-size: 0.92em;
      overflow-x: auto;
      display: block;
    }

    .markdown-sheet :global(th),
    .markdown-sheet :global(td) {
      border: 2px solid var(--border);
      padding: 10px 14px;
      text-align: left;
    }

    .markdown-sheet :global(th) {
      background: var(--bg-elevated);
      color: var(--ink);
      font-weight: 700;
    }

    /* Target highlight animation when jumping from TOC */
    .markdown-sheet :global(.target-highlight) {
      animation: highlightPulse 2.5s ease-out;
      background: var(--yellow) !important;
      color: #000000 !important;
      outline: 3px solid #000000;
      padding: 4px 8px;
    }

    @keyframes highlightPulse {
      0% {
        background: var(--yellow);
        color: #000000;
      }
      80% {
        background: var(--yellow);
        color: #000000;
      }
      100% {
        background: transparent;
        color: inherit;
        outline-color: transparent;
      }
    }

    .fallback-wrapper {
      margin: auto;
      padding: 40px 20px;
      text-align: center;
    }

    .fallback-card {
      padding: 40px;
      max-width: 440px;
    }

    .fallback-icon {
      font-size: 3.2rem;
      margin-bottom: 12px;
    }

    .fallback-hint {
      color: var(--muted);
      font-size: 0.88rem;
      margin: 10px 0 20px;
    }

    .fallback-actions {
      display: flex;
      gap: 10px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .close-drawer-btn {
      display: none;
      background: var(--bg-card);
      border: 2px solid var(--border);
      box-shadow: 2px 2px 0 var(--border);
      color: var(--ink);
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 900;
      padding: 2px 8px;
    }

    .close-drawer-btn:hover {
      background: var(--red);
      color: #FFFFFF;
    }

    /* Responsive adjustments for 2 distinct windows */
    @media (max-width: 900px) {
      .viewer-workspace-dual {
        grid-template-columns: 1fr;
      }

      .mobile-toc-btn {
        display: inline-flex;
      }

      .close-drawer-btn {
        display: block;
      }

      .toc-window {
        position: fixed;
        top: 60px;
        bottom: 20px;
        left: 16px;
        width: min(340px, calc(100vw - 32px));
        z-index: 50;
        box-shadow: 8px 8px 0 #000000;
        transform: translateX(calc(-100% - 30px));
        transition: transform 0.2s ease;
      }

      .toc-window.open-mobile {
        transform: translateX(0);
      }
    }
  `]
})
export class FileViewerComponent implements OnInit {
  @ViewChild('scrollContainer') scrollContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('pdfFrame') pdfFrame?: ElementRef<HTMLIFrameElement>;

  fileEntry: FileEntry | null = null;
  viewerType: string = 'other';
  safeUrl: SafeResourceUrl | null = null;
  googleDocsUrl: SafeResourceUrl | null = null;
  rawViewUrl = '';
  encodedViewUrl = '';
  renderedHtml = '';
  toc: TocItem[] = [];
  loading = true;
  error = false;
  sidebarOpen = false;

  // Scroll Progress and Stats
  scrollProgress = 0;
  wordCount = 0;
  readTimeMinutes = 1;
  activeAnchor = '';
  returnFolder: string | null = null;

  get isPresentation(): boolean {
    if (!this.fileEntry) return false;
    const name = this.fileEntry.originalFileName.toLowerCase();
    return name.endsWith('.pptx') || name.endsWith('.ppt');
  }

  get pdfDownloadFileName(): string {
    if (!this.fileEntry) return 'document.pdf';
    return this.fileEntry.originalFileName.replace(/\.(pptx|ppt)$/i, '.pdf');
  }

  get folderLabel(): string {
    const labels: Record<string, string> = { NOTES: 'Notes', PYQS: 'PYQs', PPTS: 'PPTs' };
    return this.fileEntry ? (labels[this.fileEntry.folderType] ?? this.fileEntry.folderType) : '';
  }

  get fileTypeLabel(): string {
    if (!this.fileEntry) return '';
    return this.fileEntry.originalFileName.split('.').pop()?.toUpperCase() ?? '';
  }

  get fileSize(): string {
    if (!this.fileEntry?.fileSize) return '';
    const b = this.fileEntry.fileSize;
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
    return (b / (1024 * 1024)).toFixed(1) + ' MB';
  }

  constructor(
    private route: ActivatedRoute,
    public api: ApiService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.returnFolder = this.route.snapshot.queryParamMap.get('folder');
    const fileId = Number(this.route.snapshot.paramMap.get('fileId'));
    this.api.getFileMetadata(fileId).subscribe({
      next: (entry) => {
        this.fileEntry = entry;
        this.viewerType = getFileViewerType(entry.originalFileName);
        this.loadFile(fileId);
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  loadFile(fileId: number): void {
    this.rawViewUrl = this.api.getFileViewUrl(fileId);
    this.encodedViewUrl = encodeURIComponent(this.rawViewUrl);

    if (this.viewerType === 'pdf' || this.viewerType === 'ppt') {
      // view=FitH ensures smooth auto-fit to width; navpanes=0 keeps focus on document
      this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.rawViewUrl + '#navpanes=0&view=FitH');
      this.loading = false;
      // Fetch TOC / Slide / Page outline from backend
      this.api.getFileToc(fileId).subscribe({
        next: (items) => {
          if (items && items.length > 0) {
            this.toc = items.map(item => ({
              label: item.label,
              level: item.level || 1,
              anchor: item.anchor || ('page=' + item.pageNumber)
            }));
            if (this.toc.length > 0 && !this.activeAnchor) {
              this.activeAnchor = this.toc[0].anchor;
            }
          }
        },
        error: () => {
          // TOC unavailable, fallback to document details
        }
      });
    } else if (this.viewerType === 'markdown' || this.viewerType === 'text') {
      this.api.getFileAsText(fileId).subscribe({
        next: (text) => {
          this.calculateStats(text);
          this.renderMarkdown(text);
          this.loading = false;
        },
        error: () => { this.error = true; this.loading = false; }
      });
    } else if (this.viewerType === 'docx') {
      this.api.getFileAsArrayBuffer(fileId).subscribe({
        next: async (buffer) => {
          await this.renderDocx(buffer);
          this.loading = false;
        },
        error: () => { this.error = true; this.loading = false; }
      });
    } else {
      this.loading = false;
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  // Track scroll position, update progress bar and scrollspy active anchor
  onScrollerScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target) return;
    const scrollTop = target.scrollTop;
    const maxScroll = target.scrollHeight - target.clientHeight;
    this.scrollProgress = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;

    // Scrollspy: locate heading closest to or above the current viewport top
    const headings = target.querySelectorAll('h1[id], h2[id], h3[id]');
    const containerRect = target.getBoundingClientRect();
    let currentAnchor = '';

    headings.forEach((heading) => {
      const hEl = heading as HTMLElement;
      const headingRect = hEl.getBoundingClientRect();
      const relativeTop = headingRect.top - containerRect.top;
      // If heading is near the top or scrolled above (within view buffer of 100px)
      if (relativeTop <= 100) {
        currentAnchor = hEl.id;
      }
    });

    if (currentAnchor && this.activeAnchor !== currentAnchor) {
      this.activeAnchor = currentAnchor;
      // Scroll the active TOC node into view inside the static sidebar if needed
      const activeBtn = document.querySelector('.toc-node.active-anchor');
      if (activeBtn) {
        activeBtn.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }

  // Interactive seek on progress bar click
  onProgressClick(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));

    if (this.scrollContainer?.nativeElement) {
      const container = this.scrollContainer.nativeElement;
      const maxScroll = container.scrollHeight - container.clientHeight;
      container.scrollTo({ top: percentage * maxScroll, behavior: 'smooth' });
    }
  }

  private calculateStats(content: string): void {
    const cleanText = content.replace(/<[^>]*>/g, ' ');
    const words = cleanText.trim().split(/\s+/).filter(w => w.length > 0).length;
    this.wordCount = words;
    this.readTimeMinutes = Math.max(1, Math.ceil(words / 200));
  }

  private async renderMarkdown(text: string): Promise<void> {
    try {
      const { marked } = await import('marked');
      // Build custom renderer to inject ID anchors for headings
      const renderer = new marked.Renderer();
      this.toc = [];

      renderer.heading = ({ text: hText, depth }: { text: string; depth: number }) => {
        const anchor = this.slugify(hText);
        if (depth <= 3) {
          this.toc.push({ label: hText.replace(/<[^>]*>/g, '').trim(), level: depth, anchor });
        }
        return `<h${depth} id="${anchor}">${hText}</h${depth}>`;
      };

      const html = await marked(text, { renderer });
      this.renderedHtml = html as string;
    } catch {
      this.renderedHtml = `<pre>${text}</pre>`;
    }
  }

  private async renderDocx(buffer: ArrayBuffer): Promise<void> {
    try {
      const mammoth = await import('mammoth');
      const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
      const rawHtml = result.value;

      this.calculateStats(rawHtml);

      // Parse with DOMParser to inject anchor IDs for headings so TOC links work
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawHtml, 'text/html');
      this.toc = [];

      doc.querySelectorAll('h1, h2, h3').forEach((el, index) => {
        const depth = parseInt(el.tagName.charAt(1));
        const label = el.textContent?.trim() ?? `Section ${index + 1}`;
        const anchor = this.slugify(label) || `sec-${index}`;
        el.setAttribute('id', anchor);
        this.toc.push({ label, level: depth, anchor });
      });

      this.renderedHtml = doc.body.innerHTML;
    } catch {
      this.renderedHtml = '<p>Could not render this DOCX file.</p>';
    }
  }

  private slugify(str: string): string {
    return str
      .toLowerCase()
      .replace(/<[^>]*>/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  scrollToAnchor(anchor: string): void {
    this.activeAnchor = anchor;
    if (this.sidebarOpen) {
      this.sidebarOpen = false;
    }
    if (!anchor) return;

    if (this.viewerType === 'pdf' || this.viewerType === 'ppt') {
      const targetUrl = `${this.rawViewUrl}#${anchor}&navpanes=0&view=FitH`;
      if (this.pdfFrame?.nativeElement) {
        this.pdfFrame.nativeElement.src = targetUrl;
      } else {
        this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(targetUrl);
      }
      return;
    }

    setTimeout(() => {
      const container = this.scrollContainer?.nativeElement;
      const el = document.getElementById(anchor);
      if (container && el) {
        const containerRect = container.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const scrollTarget = container.scrollTop + (elRect.top - containerRect.top) - 24;
        container.scrollTo({ top: scrollTarget, behavior: 'smooth' });

        el.classList.add('target-highlight');
        setTimeout(() => el.classList.remove('target-highlight'), 2000);
      } else if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.classList.add('target-highlight');
        setTimeout(() => el.classList.remove('target-highlight'), 2000);
      }
    }, 40);
  }
}