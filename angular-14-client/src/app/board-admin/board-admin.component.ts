import { Router } from '@angular/router';
import { NotificationService } from './../_services/notification.service';
import { ToolService } from './../_services/tool.service';
import { Component, OnInit } from '@angular/core';
import { AdminService } from '../_services/admin.service';
import { UserService } from '../_services/user.service';
import {
  animate,
  AUTO_STYLE,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {
  actions_metadata_t,
  generic_table_attr,
} from '../generic-table/generic-table.component';
import { interval, takeWhile } from 'rxjs';

const DEFAULT_DURATION = 3000;

@Component({
  selector: 'app-board-admin',
  templateUrl: './board-admin.component.html',
  styleUrls: ['./board-admin.component.css'],
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
  ],
})
export class BoardAdminComponent implements OnInit {
  organization_form: any = {
    organization_code: null,
  };

  system_info: any = {
    total_users: null,
    total_tools: null,
    total_notifications: null,
    pending_requests: null,
  };

  err_msg?: string;

  suspended_users_attr: generic_table_attr = {
    height: 'height: 15rem;',
    is_collapsable: true,
    headers: ['#', 'First Name', 'Last Name'],
    card_attrs: ['Username', 'Email', 'Phone'],
    entry_info: [],
  };

  deleted_users_attr: generic_table_attr = {
    height: 'height: 15rem;',
    is_collapsable: true,
    headers: ['#', 'First Name', 'Last Name'],
    card_attrs: ['Username', 'Email', 'Phone'],
    entry_info: [],
  };

  active_borrows_attr: generic_table_attr = {
    height: 'height: 15rem;',
    is_collapsable: false,
    headers: ['#', 'Tool Name', 'Owner', 'Borrower', 'Expiration Date'],
    card_attrs: [],
    entry_info: [],
  };

  /* A map that maps the headers of the table to the attributes of the model. */
  headers2model_attr: any = {
    'First Name': 'fname',
    'Last Name': 'lname',
    Username: 'username',
    Email: 'email',
    Phone: 'phone',
    'Tool Name': 'tool_name',
    Owner: 'owner_name',
    Borrower: 'requestor_name',
    'Expiration Date': 'expiration_date_s',
  };

  action_msg?: string;
  isActionSucceed: boolean = false;
  isActionFailed: boolean = false;
  deleted_users_functions: Array<actions_metadata_t> = [
    {
      action: (i: any) => {
        this.activate_deleted_user(i);
      },
      icon: 'fas fa-trash-restore',
    },
  ];

  active_borrows_functions: Array<actions_metadata_t> = [
    {
      icon: 'fa-solid fa-link',
      action: (i: any) => {
        this.go_to_tool(i);
      },
    },
  ];

  constructor(
    private router: Router,
    private userService: UserService,
    private toolService: ToolService,
    private adminService: AdminService,
    private notificationService: NotificationService
  ) {}

  /**
   * The function is called when the component is initialized. It calls the getAdminBoard() function in
   * the userService.ts file. The function returns an observable. The observable is subscribed to and
   * the next and error functions are defined. The next function sets the content variable to the data
   * returned by the observable. The error function sets the content variable to the error message
   */
  ngOnInit(): void {
    // Query suspended and deleted users
    this.userService
      .usersByFilter({
        filter: { $or: [{ is_suspended: true }, { is_deleted: true }] },
      })
      .subscribe({
        next: (data) => {
          const users_info = data.users;
          for (let i = 0; i < users_info.length; i++) {
            if (users_info[i].is_deleted === false) {
              // Only suspended
              this.suspended_users_attr.entry_info.push(data.users[i]);
            } else {
              this.deleted_users_attr.entry_info.push(data.users[i]);
            }
          }
          this.userService.usersAmount().subscribe({
            next: (data) => {
              this.system_info.total_users = data.amount - users_info.length;
            },
            error: async (err) => {
              this.parse_error_msg(err);
              await this.display_alert(false);
            },
          });
        },
        error: async (err) => {
          this.parse_error_msg(err);
          await this.display_alert(false);
        },
      });

    this.update_active_requests_attrs();

    this.update_pending_requests_amount();

    this.update_notifications_amount();

    this.update_tool_amout();

    interval(7000)
        .pipe(takeWhile((value) => true))
        .subscribe(
          (value: number) => {
            this.update_active_requests_attrs();

            this.update_pending_requests_amount();
        
            this.update_notifications_amount();
        
            this.update_tool_amout();
          },
          (error: any) => {
            console.log('interval function observe encountered an error');
          },
          () => {
            console.log('interval function observe completed successfully!');
          }
        );
    
  }

  async update_active_requests_attrs() {
    // Query 'approved' tool requests
    this.toolService
      .getRequestsByFilter({ filter: { status: 'approved' } })
      .subscribe({
        next: (data) => {
          this.active_borrows_attr.entry_info = data.requests;
          for (let i = 0; i < this.active_borrows_attr.entry_info.length; i++) {
            this.active_borrows_attr.entry_info[i].tool_name =
              this.active_borrows_attr.entry_info[i].tool.name;
            this.active_borrows_attr.entry_info[i].owner_name =
              this.active_borrows_attr.entry_info[i].tool.owner.username;
            this.active_borrows_attr.entry_info[i].requestor_name =
              this.active_borrows_attr.entry_info[i].requestor.username;
            this.active_borrows_attr.entry_info[i].expiration_date_s =
              this.date2str(
                this.active_borrows_attr.entry_info[i].expiration_date
              );
          }
        },
        error: async (err) => {
          this.parse_error_msg(err);
          await this.display_alert(false);
        },
      });
  }

  async update_notifications_amount() {
    // Query in a loop the total notification number
    this.notificationService.notificationsAmount().subscribe({
      next: (data) => {
        this.system_info.total_notifications = data.amount;
      },
      error: async (err) => {
        this.parse_error_msg(err);
        await this.display_alert(false);
      },
    });
  }

  async update_pending_requests_amount() {
    // Query in a loop number of pending requests amount
    this.toolService.getPendingRequestsAmount().subscribe({
      next: (data) => {
        this.system_info.pending_requests = data.amount;
      },
      error: async (err) => {
        this.parse_error_msg(err);
        await this.display_alert(false);
      },
    });
  }

  async update_tool_amout() {
    // Query tools amount in a loop
    this.toolService.getToolsAmount().subscribe({
      next: (data) => {
        this.system_info.total_tools = data.amount;
      },
      error: async (err) => {
        this.parse_error_msg(err);
        await this.display_alert(false);
      },
    });
  }

  /**
   * The function is called when the user clicks the submit button on the form.
   * The function then calls the adminService.setOrganizationCode() function, which is defined in the
   * admin.service.ts file.
   */
  onSetOrganizationCode(): void {
    const organization_code = this.organization_form.organization_code;

    this.adminService.setOrganizationCode(organization_code).subscribe({
      next: async (data) => {
        this.action_msg = data.message;
        await this.display_alert(true);
      },
      error: async (err) => {
        this.parse_error_msg(err);
        await this.display_alert(false);
      },
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

  /**
   * If the action is successful, set the success flag to true and the failure flag to false, then wait
   * 3 seconds, then set the success flag to false. If the action is not successful, set the failure
   * flag to true and the success flag to false, then wait 3 seconds, then set the failure flag to
   * false. Then wait 3 seconds, then set the action message to an empty string.
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
   * If the error is a string, parse it as JSON and get the message property. If it's not a string,
   * just get the message property. If it's neither, get the statusText property.
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

  activate_deleted_user(i: any) {
    if (
      confirm(
        `Are you sure you want to restore ${this.deleted_users_attr.entry_info[i].fname} ${this.deleted_users_attr.entry_info[i].lname}?`
      )
    ) {
      this.userService
        .restoreUser(this.deleted_users_attr.entry_info[i]._id)
        .subscribe({
          next: async (data) => {
            this.suspended_users_attr.entry_info.unshift(
              this.deleted_users_attr.entry_info.splice(i, 1)[0]
            );
            this.action_msg = data.message;
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
   * It takes a date object and returns a string in the format of "YYYY-MM-DD HH:MM:SS"
   * @param {Date} date - Date - The date to be formatted.
   * @returns A string in the format of "MM/DD/YYYY HH:MM:SS"
   */
  date2str(date: Date): string {
    const date_ = new Date(date);

    const hours = (date_.getHours() < 10 ? '0' : '') + date_.getHours();
    const minutes = (date_.getMinutes() < 10 ? '0' : '') + date_.getMinutes();
    const seconds = (date_.getSeconds() < 10 ? '0' : '') + date_.getSeconds();
    return `${date_.toLocaleDateString()} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * "This function navigates to a specific tool page based on the tool's id."
   * </code>
   * @param {any} i - any =&gt; the index of the entry_info array
   */
  go_to_tool(i: any) {
    this.router.navigate([
      '/tools/board-tool/',
      this.active_borrows_attr.entry_info[i].tool._id,
    ]);
  }
}
