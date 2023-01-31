import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../_services/auth.service';
import { StorageService } from '../_services/storage.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  form: any = {
    username: null,
    password: null,
  };
  isLoggedIn = false;
  isLoginFailed = false;
  errorMessage = '';
  roles: string[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private storageService: StorageService
  ) {}

  /**
   * If the user is logged in, set the isLoggedIn variable to true and set the roles variable to the
   * user's roles.
   */
  ngOnInit(): void {
    if (this.storageService.isLoggedIn()) {
      this.isLoggedIn = true;
      this.roles = this.storageService.getUser().roles;
    }
  }

  /**
   * "When the user clicks the submit button, the function will call the login function in the
   * authService, which will return a response. If the response is successful, the user will be saved
   * in the local storage and the page will reload. If the response is not successful, the error
   * message will be displayed."
   * </code>
   */
  onSubmit(): void {
    const { username, password } = this.form;

    this.authService.login(username, password).subscribe({
      next: async (data) => {
        this.storageService.saveUser(data);

        this.isLoginFailed = false;
        this.isLoggedIn = true;
        this.roles = this.storageService.getUser().roles;
        await this.delay(1);
        this.router.navigate(['home']).then( () => {
          this.reloadPage();
        });
      },
      error: (err) => {
        this.errorMessage = err.error.message;
        this.isLoginFailed = true;
      },
    });
  }

  /**
   * The reloadPage() function reloads the current page.
   */
  reloadPage(): void {
    window.location.reload();
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
