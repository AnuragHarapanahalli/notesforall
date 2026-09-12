import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="site-footer">
      <div class="container footer-content">
        <div class="footer-box">
          <p class="credit-text">
            <span>[ SYSTEM: NOTES_FOR_ALL // ARCHITECTURE: NEO_BRUTALIST_BENTO ]</span>
            <span>MADE BY <strong>ANURAG</strong> // ACADEMIC FREEDOM</span>
          </p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .site-footer {
      padding: 24px 0 32px;
      margin-top: auto;
    }

    .footer-box {
      background: var(--bg-card);
      border: var(--border-thin) solid var(--border);
      box-shadow: 4px 4px 0 var(--border);
      padding: 14px 20px;
    }

    .credit-text {
      font-family: var(--font-mono);
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--ink);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }

    .credit-text strong {
      background: var(--yellow);
      color: #000000;
      padding: 2px 6px;
      border: 1px solid var(--border);
    }
  `]
})
export class FooterComponent {}