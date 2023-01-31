import { Router } from '@angular/router';
import { NotificationService } from './../_services/notification.service';
import { map } from 'rxjs/operators';
import { ToolService } from './../_services/tool.service';
import { UserService } from './../_services/user.service';
import { Component, OnInit } from '@angular/core';
import { StorageService } from '../_services/storage.service';
import {
  actions_metadata_t,
  generic_table_attr,
} from '../generic-table/generic-table.component';
import {
  animate,
  AUTO_STYLE,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';

const DEFAULT_DURATION = 3000;

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  animations: [
    trigger('fade', [
      state('false', style({ visibility: AUTO_STYLE, opacity: 0 })),
      state('true', style({ visibility: AUTO_STYLE, opacity: 1 })),
      transition('false => true', animate(1000, style({ opacity: 1 }))),
      transition(
        'true => false',
        animate(DEFAULT_DURATION, style({ opacity: 0 }))
      ),
    ]),
    trigger('collapse', [
      state('false', style({ height: AUTO_STYLE, visibility: AUTO_STYLE })),
      state('true', style({ height: '0', visibility: 'hidden' })),
      transition('false => true', animate(600 + 'ms ease-in')),
      transition('true => false', animate(600 + 'ms ease-out')),
    ]),
  ],
})
export class ProfileComponent implements OnInit {
  edit_state: boolean = false;
  current_user?: any;
  err_msg?: string;

  form: any = {
    fname: null,
    lname: null,
    email: null,
    phone: null,
    password: null,
    job: null,
    description: null,
    allow_emails: false,
  };
  isActionSucceed: boolean = false;
  isActionFailed: boolean = false;
  isSuccessful = false;
  isChangesFailed = false;
  errorMessage = '';
  action_msg = '';

  notification_functions: Array<actions_metadata_t> = [
    {
      icon: 'fas fa-trash-alt',
      action: (i: any) => {
        this.delete_notification(i);
      },
    },
  ];

  tool_functions: Array<actions_metadata_t> = [
    {
      icon: 'fa-solid fa-link',
      action: (i: any) => {
        this.go_to_my_tool(i);
      },
    },
  ];

  my_pending_requests_functions: Array<actions_metadata_t> = [
    {
      icon: 'fa-solid fa-link',
      action: (i: any) => {
        this.go_to_tool_i_want(i);
      },
    },
  ];

  borrow_functions: Array<actions_metadata_t> = [
    {
      icon: 'fa-solid fa-link',
      action: (i: any) => {
        this.go_to_my_borrow(i);
      },
    },
  ];

  post_collape_func: any = (i: any) => {
    this.sign_notification_as_watched(i);
  };

  my_tools_attrs: generic_table_attr = {
    height: 'height: 400px;',
    is_collapsable: true,
    headers: ['#', 'Tool Name', 'Status'],
    card_attrs: [
      'Max Borrow Time',
      'Categories',
      'Manufacturing Date',
      'Producer',
      'Description',
    ],
    entry_info: [],
  };

  my_pending_attrs: generic_table_attr = {
    height: 'height: 400px;',
    is_collapsable: false,
    headers: ['#', 'Tool Name', 'Owner Name', 'Expiration Date'],
    card_attrs: [],
    entry_info: [],
  };

  public my_notifications_attrs: generic_table_attr = {
    height: 'height: 400px;',
    is_collapsable: true,
    headers: ['#', 'From', 'Date'],
    card_attrs: ['Content', 'Link'],
    entry_info: [],
  };

  my_borrows_attrs: generic_table_attr = {
    height: 'height: 267px;',
    is_collapsable: false,
    headers: ['#', 'Tool Name', 'Expired'],
    card_attrs: [],
    entry_info: [],
  };

  headers2model_attr: any = {
    Date: 'date',
    Content: 'content',
    Link: 'link',
    From: 'sender_full_name',
    'Tool Name': 'name',
    Expired: 'expiration_date',
    'Manufacturing Date': 'manufacturing_date',
    Status: 'status',
    'Max Borrow Time': 'max_time_borrow',
    'Expiration Date': 'expiration_date_s',
    Categories: 'categories',
    Producer: 'producer',
    Owner: 'owner',
    Decription: 'description',
    'Owner Name': 'owner_full_name',
  };

  user_properties: { [key: string]: string } = {
    'Full name': 'full_name',
    Email: 'email',
    Phone: 'phone',
    'Tools amount': 'tools_amount',
    Rank: 'rank',
  };

  constructor(
    private router: Router,
    private user_service: UserService,
    private tool_service: ToolService,
    private storage_service: StorageService,
    private notification_service: NotificationService
  ) {}

  /**
   * It gets the user's data, then gets the user's tools, then gets the user's notifications, then gets
   * the user's borrows.
   */
  ngOnInit(): void {
    this.user_service.getUser().subscribe({
      next: (data) => {
        let tmp = this.form;
        this.current_user = data.user;
        this.current_user.full_name = `${this.capitalize_strings(
          this.current_user.fname
        )} ${this.capitalize_strings(this.current_user.lname)}`;
        Object.keys(this.form).forEach(function (key, index) {
          if (key !== 'password') {
            tmp[key] = data.user[key];
          }
        });

        this.tool_service.getMyTools().subscribe({
          next: (data) => {
            this.my_tools_attrs.entry_info = data.tools;
            this.current_user.tools_amount =
              this.my_tools_attrs.entry_info.length;
          },
          error: (err) => {
            if (err.error) {
              try {
                const res = JSON.parse(err.error);
                this.err_msg = res.message;
              } catch {
                this.err_msg = `Error with status: ${err.status} - ${err.statusText}`;
              }
            } else {
              this.err_msg = `Error with status: ${err.status}`;
            }
          },
        });
      },
      error: (err) => {
        if (err.error) {
          try {
            const res = JSON.parse(err.error);
            this.err_msg = res.message;
          } catch {
            this.err_msg = `Error with status: ${err.status} - ${err.statusText}`;
          }
        } else {
          this.err_msg = `Error with status: ${err.status}`;
        }
      },
    });

    this.tool_service.getMyNotifications().subscribe({
      next: (data) => {
        this.my_notifications_attrs.entry_info = data.notifications;
        for (
          let i = 0;
          i < this.my_notifications_attrs.entry_info.length;
          i++
        ) {
          this.my_notifications_attrs.entry_info[i].sender_full_name = this
            .my_notifications_attrs.entry_info[i].sender
            ? `${this.capitalize_strings(
                this.my_notifications_attrs.entry_info[i].sender.fname
              )} ${this.capitalize_strings(
                this.my_notifications_attrs.entry_info[i].sender.lname
              )}`
            : 'Unknown';
          this.my_notifications_attrs.entry_info[i].date = this.date2str(
            this.my_notifications_attrs.entry_info[i].date
          );
        }
      },
      error: (err) => {
        if (err.error) {
          try {
            const res = JSON.parse(err.error);
            this.err_msg = res.message;
          } catch {
            this.err_msg = `Error with status: ${err.status} - ${err.statusText}`;
          }
        } else {
          this.err_msg = `Error with status: ${err.status}`;
        }
      },
    });
    this.tool_service.getMyBorrows().subscribe({
      next: (data) => {
        this.my_borrows_attrs.entry_info = data.requests;
        for (let i = 0; i < this.my_borrows_attrs.entry_info.length; i++) {
          this.my_borrows_attrs.entry_info[i]._id =
            this.my_borrows_attrs.entry_info[i].tool._id;
          this.my_borrows_attrs.entry_info[i].name =
            this.my_borrows_attrs.entry_info[i].tool.name;
          this.my_borrows_attrs.entry_info[i].expiration_date = this.date2str(
            this.my_borrows_attrs.entry_info[i].expiration_date
          );
        }
      },
      error: (err) => {
        if (err.error) {
          try {
            const res = JSON.parse(err.error);
            this.err_msg = res.message;
          } catch {
            this.err_msg = `Error with status: ${err.status} - ${err.statusText}`;
          }
        } else {
          this.err_msg = `Error with status: ${err.status}`;
        }
      },
    });

    this.tool_service
      .getRequestsByFilter({
        filter: { requestor: this.storage_service.getUser().id, status: 'pending' },
      })
      .subscribe({
        next: (data) => {
          this.my_pending_attrs.entry_info = data.requests;
          for (let i = 0; i < this.my_pending_attrs.entry_info.length; i++) {
            this.my_pending_attrs.entry_info[i].name =
              this.my_pending_attrs.entry_info[i].tool.name;
            this.my_pending_attrs.entry_info[i].owner_full_name = this
              .my_pending_attrs.entry_info[i].tool.owner
              ? `${this.capitalize_strings(
                  this.my_pending_attrs.entry_info[i].tool.owner.fname
                )} ${this.capitalize_strings(
                  this.my_pending_attrs.entry_info[i].tool.owner.lname
                )}`
              : 'Unknown';
            this.my_pending_attrs.entry_info[i].expiration_date_s =
              this.date2str(
                this.my_pending_attrs.entry_info[i].expiration_date
              );
          }
        },
        error: (err) => {
          if (err.error) {
            try {
              const res = JSON.parse(err.error);
              this.err_msg = res.message;
            } catch {
              this.err_msg = `Error with status: ${err.status} - ${err.statusText}`;
            }
          } else {
            this.err_msg = `Error with status: ${err.status}`;
          }
        },
      });
  }

  sign_notification_as_watched(i: any) {
    if (this.my_notifications_attrs.entry_info[i].seen) {
      return;
    }

    this.notification_service
      .markAsSeen(this.my_notifications_attrs.entry_info[i]._id)
      .subscribe({
        next: (data) => {
          this.my_notifications_attrs.entry_info[i].seen = true;
        },
        error: (err) => {
          if (err.error) {
            try {
              const res = JSON.parse(err.error);
              this.err_msg = res.message;
            } catch {
              this.err_msg = `Error with status: ${err.status} - ${err.statusText}`;
            }
          } else {
            this.err_msg = `Error with status: ${err.status}`;
          }
        },
      });
  }

  /**
   * It takes a string, slices the first character off, capitalizes it, and then concatenates it with
   * the rest of the string
   * @param {string} str - string - This is the string that we want to capitalize.
   * @returns The first character of the string is being returned in uppercase, and the rest of the
   * string is being returned in lowercase.
   */
  capitalize_strings(str: string): string {
    return str.slice(0, 1).toUpperCase() + str.slice(1);
  }

  /**
   * It takes a date object and returns a string in the format of "YYYY-MM-DD HH:MM:SS"
   * @param {Date} date - Date - The date to convert to a string.
   * @returns A string with the date and time in the format: `MM/DD/YYYY HH:MM:SS`
   */
  date2str(date: Date): string {
    const date_ = new Date(date);

    const hours = (date_.getHours() < 10 ? '0' : '') + date_.getHours();
    const minutes = (date_.getMinutes() < 10 ? '0' : '') + date_.getMinutes();
    const seconds = (date_.getSeconds() < 10 ? '0' : '') + date_.getSeconds();
    return `${date_.toLocaleDateString()} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * It deletes a notification from the database and then removes it from the UI.
   * @param {any} i - any = the index of the notification in the array of notifications
   */
  delete_notification(i: any) {
    if (confirm('Are you sure you want to delete this message?')) {
      this.notification_service
        .deleteNotification(this.my_notifications_attrs.entry_info[i]._id)
        .subscribe({
          next: async (data) => {
            // For UI:
            this.action_msg = data.message;
            this.my_notifications_attrs.entry_info.splice(i, 1);
            await this.display_alert(true);
          },
          error: async (err) => {
            this.parse_error_msg(err);
            await this.display_alert(false);
          },
        });
    }
  }

  /**
   * "This function navigates to the tool page of the tool that was clicked on."
   * </code>
   * @param {any} i - any -&gt; the index of the tool in the array
   */
  go_to_my_tool(i: any) {
    this.router.navigate([
      '/tools/board-tool/',
      this.my_tools_attrs.entry_info[i]._id,
    ]);
  }

  /**
   * "This function navigates to the tool page of the tool that was clicked on."
   * </code>
   * @param {any} i - any -&gt; the index of the tool in the array
   */
  go_to_tool_i_want(i: any) {
    this.router.navigate([
      '/tools/board-tool/',
      this.my_pending_attrs.entry_info[i].tool._id,
    ]);
  }

  /**
   * "This function navigates to a specific tool page based on the tool's id."
   * </code>
   * @param {any} i - any =&gt; the index of the entry_info array
   */
  go_to_my_borrow(i: any) {
    this.router.navigate([
      '/tools/board-tool/',
      this.my_borrows_attrs.entry_info[i]._id,
    ]);
  }

  /**
   * When the edit button is clicked, the edit_state is set to true.
   */
  edit_user() {
    this.edit_state = true;
  }

  /**
   * It takes the form data and compares it to the current user data. If there are any changes, it will
   * update the user data.
   * </code>
   */
  save_changes() {
    this.edit_state = false;

    let changes: any = {};
    let tmp = this.form;
    let current_user = this.current_user;
    Object.keys(this.form).forEach(function (key, index) {
      if (
        (key !== 'password' && tmp[key] !== current_user[key]) ||
        (key === 'password' && tmp[key] !== null)
      ) {
        changes[key] = tmp[key];
      }
    });

    this.user_service.updateUser(changes).subscribe({
      next: async (data) => {
        // For UI:
        this.action_msg = data.message;

        this.current_user = data.user;
        this.current_user.tools_amount = this.my_tools_attrs.entry_info.length;
        this.current_user.full_name = `${this.capitalize_strings(
          this.current_user.fname
        )} ${this.capitalize_strings(this.current_user.lname)}`;

        await this.display_alert(true);
      },
      error: async (err) => {
        this.parse_error_msg(err);
        await this.display_alert(false);
      },
    });
  }

  /**
   * It takes the current user's data and puts it back into the form
   */
  cancel_changes() {
    this.edit_state = false;
    let tmp = this.form;
    let current_user = this.current_user;
    Object.keys(this.form).forEach(function (key, index) {
      if (key !== 'password') {
        tmp[key] = current_user[key];
      }
    });
  }

  /**
   * It returns a promise that resolves after a given number of seconds.
   * @param {number} sec - number - The number of seconds to delay.
   * @returns A promise that will resolve after the specified number of seconds.
   */
  delay(sec: number) {
    return new Promise((resolve) => setTimeout(resolve, sec * 1000));
  }

  /**
   * If the is_sucess parameter is true, then set isActionFailed to false, set isActionSucceed to true,
   * wait 3 seconds, set isActionSucceed to false, wait 3 seconds, set action_msg to an empty string.
   *
   * If the is_sucess parameter is false, then set isActionFailed to true, set isActionSucceed to
   * false, wait 3 seconds, set isActionFailed to false, wait 3 seconds, set action_msg to an empty
   * string.
   * @param {boolean} is_sucess - boolean - this is a boolean value that determines whether the action
   * was successful or not.
   */
  async display_alert(is_sucess: boolean) {
    if (is_sucess) {
      this.isActionFailed = false;
      this.isActionSucceed = true;
      await this.delay(3);
      this.isActionSucceed = false;
    } else {
      this.isActionFailed = true;
      this.isActionSucceed = false;
      await this.delay(3);
      this.isActionFailed = false;
    }
    await this.delay(3);
    this.action_msg = '';
  }

  /**
   * If the error is a string, parse it as JSON and get the message property.
   * If the error is an object, get the message property.
   * If the error is neither, get the statusText property.
   * </code>
   * @param {any} err - any - the error object
   */
  parse_error_msg(err: any) {
    let message = '';

    if (err.error) {
      try {
        if (typeof err.error === 'string') {
          message = JSON.parse(err.error).message;
        } else {
          message = err.error.message;
        }
      } catch {
        message = err.statusText;
      }
    }

    this.action_msg = `Error with status: ${err.status} - ${message}`;
  }
}
