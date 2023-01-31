import { Component, OnInit } from '@angular/core';
import { UserService } from '../_services/user.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  current_user_name: string = '';

  constructor(private user_service: UserService) {}

  ngOnInit(): void {
    this.user_service.getUser().subscribe({
      next: (data) => {
        this.current_user_name = data.user;
        this.current_user_name = `${this.capitalize_strings(
          data.user.fname
        )} ${this.capitalize_strings(data.user.lname)}`;
      },
      error: (err) => {
      },
    });
  }

  capitalize_strings(str: string): string {
    return str.slice(0, 1).toUpperCase() + str.slice(1);
  }
}
