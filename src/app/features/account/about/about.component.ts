import { Component } from '@angular/core';

@Component({
  selector: 'app-account-about',
  standalone: true,
  template: `
    <div class="page text-center about-page">
      <img src="/assets/brand/arinpark-logo.png" alt="ArinPark" style="width:min(240px,70%);height:auto" />
      <p class="about-version">Versión: 1.0 (1)</p>
      <p class="about-developer">Desarrollado por Gertek S.L.</p>
    </div>
  `,
  styles: [
    `
    .about-page { padding-top:1.5rem; }
    .about-logo { margin:0 auto 1rem; }
    .about-logo svg { width:64px; height:64px; }
    .about-name { font-size:1.3rem; font-weight:800; margin-bottom:.25rem; }
    .about-version { color:var(--color-text-muted); font-size:.9rem; }
    .about-developer { color:var(--color-text-muted); font-size:.82rem; margin-top:.35rem; }
  `,
  ],
})
export class AccountAboutComponent {}
