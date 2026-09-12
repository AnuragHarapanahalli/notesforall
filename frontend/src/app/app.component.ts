import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/shared/navbar/navbar.component';
import { FooterComponent } from './components/shared/footer/footer.component';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>

    <main class="main-content">
      <router-outlet></router-outlet>
    </main>

    <app-footer></app-footer>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      position: relative;
      background-color: var(--bg);
    }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding-top: clamp(20px, 3.5vw, 36px);
      padding-bottom: clamp(32px, 5vw, 56px);
    }
  `]
})
export class AppComponent {
  private theme = inject(ThemeService);
}