import { Component } from '@angular/core';
// 1. IMPORTE O ViewportScroller
import { ViewportScroller } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [], 
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {

  constructor(private scroller: ViewportScroller) {}

  public scrollToLogin(): void {
    this.scroller.scrollToAnchor('login-form-section');
  }
}