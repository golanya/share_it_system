import { interval, takeWhile } from 'rxjs';
import { NotificationService } from './_services/notification.service';
import { Component } from '@angular/core';
import { StorageService } from './_services/storage.service';
import { AuthService } from './_services/auth.service';
import {
  AUTO_STYLE,
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';

const DEFAULT_DURATION = 300;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [
    trigger('collapse', [
      state('false', style({ height: AUTO_STYLE, visibility: AUTO_STYLE })),
      state('true', style({ height: '0', visibility: 'hidden' })),
      transition('false => true', animate(DEFAULT_DURATION + 'ms ease-in')),
      transition('true => false', animate(DEFAULT_DURATION + 'ms ease-out')),
    ]),
  ],
})
export class AppComponent {
  private roles: string[] = [];
  isLoggedIn = false;
  showAdminBoard = false;
  username?: string;
  notification_amount?: any;
  user_logged_out: boolean = false;

  navbarCollapsed = true;
  nav_class = 'navbar-collapse collapse';

  constructor(
    private notification_service: NotificationService,
    private storageService: StorageService,
    private authService: AuthService
  ) {}

  /**
   * If the user is logged in, then get the user's roles and username from the storage service and set
   * the showAdminBoard variable to true if the user has the ADMIN role.
   */
  ngOnInit(): void {
    this.isLoggedIn = this.storageService.isLoggedIn();

    if (this.isLoggedIn) {
      const user = this.storageService.getUser();
      this.roles = user.roles;

      this.showAdminBoard = this.roles.includes('ADMIN');

      this.username = user.username;

      this.user_logged_out = false;
      interval(2000)
        .pipe(takeWhile((value) => this.user_logged_out !== true))
        .subscribe(
          (value: number) => {
            this.notification_service.unwatched_notifications().subscribe({
              next: (data) => {
                if (data.notifications.length > 0) {
                  this.notification_amount = data.notifications.length;
                } else {
                  this.notification_amount = undefined;
                }
              },
              error: (err) => {
                console.log(err);
                this.notification_amount = undefined;
              },
            });
          },
          (error: any) => {
            console.log('Unwatched notifications observe encountered an error');
          },
          () => {
            console.log('Unwatched notifications observe completed successfully!');
          }
        );
    }
  }

  /**
   * I'm calling the logout() function from the authService, and then I'm cleaning the storageService,
   * and then I'm reloading the page.
   */
  logout(): void {
    this.authService.logout().subscribe({
      next: (res) => {
        console.log(res);
        this.storageService.clean();

        this.user_logged_out = false;
      },
      error: (err) => {
        console.log(err);
      },
    });

    window.location.reload();
  }

  /**
   * If the navbar is collapsed, then show it, otherwise hide it.
   */
  collapse() {
    this.navbarCollapsed = !this.navbarCollapsed;
    this.nav_class = `navbar-collapse collapse ${
      this.navbarCollapsed ? 'show' : ''
    }`;
  }
}
