import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../_services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  form: any = {
    fname: null,
    lname: null,
    username: null,
    email: null,
    phone: null,
    password: null,
    organization_code: null,
    job: null,
    description: null,
    allow_emails: false
  };
  isSuccessful = false;
  isSignUpFailed = false;
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
  }

  /**
   * It takes the values from the form and sends them to the authService.register() function.
   */
  onSubmit(): void {
    const { fname, lname, username, email, phone, password, organization_code, job, description, allow_emails } = this.form;

    this.authService.register(fname, lname, username, email, phone, password, organization_code, job, description, allow_emails).subscribe({
      next: async data => {
        this.isSuccessful = true;
        this.isSignUpFailed = false;
        await this.delay(3);
        this.router.navigateByUrl('login');
      },
      error: err => {
        this.errorMessage = err.error.message;
        this.isSignUpFailed = true;
      }
    });
  }

  /**
   * It returns a promise that resolves after a given number of seconds.
   * @param {number} sec - number - The number of seconds to wait before resolving the promise.
   * @returns A promise that will resolve after the specified number of seconds.
   */
  delay(sec: number) {
    return new Promise((resolve) => setTimeout(resolve, sec * 1000));
  }
}
