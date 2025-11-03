import { Component } from '@angular/core';
import { MiddleComponent } from '../../components/middle/middle.component';
import { LoginFormComponent } from '../../components/login-form/login-form.component';

@Component({
  selector: 'app-login',
  imports: [MiddleComponent, LoginFormComponent],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css',
})
export class LoginPage {

}
