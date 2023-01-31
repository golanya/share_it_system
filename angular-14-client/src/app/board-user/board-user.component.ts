import { StorageService } from './../_services/storage.service';
import {
  actions_metadata_t,
  generic_table_attr,
} from './../generic-table/generic-table.component';
import { Component, OnInit } from '@angular/core';
import { UserService } from '../_services/user.service';
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
  selector: 'app-board-user',
  templateUrl: './board-user.component.html',
  styleUrls: ['./board-user.component.css'],
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
export class BoardUserComponent implements OnInit {
  err_msg?: string;
  entry_info_backup: any = [];
  search_pattern: string = '';
  table_attrs: generic_table_attr = {
    height: 'height: 50rem; !important',
    is_collapsable: true,
    headers: ['#', 'First Name', 'Last Name', 'User Name'],
    card_attrs: [
      'Phone Number',
      'Email',
      'Rank',
      'Roles',
      'Job',
      'Description',
    ],
    entry_info: [],
  };

  isActionSucceed: boolean = false;
  isActionFailed: boolean = false;
  action_msg = '';

  functions?: Array<actions_metadata_t>;

  headers2model_attr: any = {
    'First Name': 'fname',
    'Last Name': 'lname',
    'User Name': 'username',
    'Phone Number': 'phone',
    Email: 'email',
    Rank: 'rank',
    Roles: '_roles',
    Job: 'job',
    Description: 'description',
  };

  constructor(
    private userService: UserService,
    private storage_service: StorageService
  ) {}

  /**
   * It gets all the users from the database, then it loops through each user and adds a new property
   * to each user called _roles, which is a string of all the roles that the user has. Then it checks
   * if the user has the role of admin, and if they do, it adds a new property to each user called
   * function, which is an object with an icon and an action.
   */
  ngOnInit(): void {
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.table_attrs.entry_info = JSON.parse(data).users;
        for (let i = 0; i < this.table_attrs.entry_info.length; i++) {
          this.table_attrs.entry_info[i]._roles = '';
          for (
            let j = 0;
            j < this.table_attrs.entry_info[i].roles.length;
            j++
          ) {
            if (j == 0) {
              this.table_attrs.entry_info[
                i
              ]._roles += `${this.table_attrs.entry_info[i].roles[
                j
              ].name.toUpperCase()}`;
            } else {
              this.table_attrs.entry_info[
                i
              ]._roles += `, ${this.table_attrs.entry_info[i].roles[
                j
              ].name.toUpperCase()}`;
            }
          }
          if (this.storage_service.getUser().roles.includes('ADMIN')) {
            this.functions = [
              {
                icon: 'fas fa-trash-alt',
                action: (i: any) => {
                  this.delete_user(i);
                },
              },
            ];

            for (let i = 0; i < this.table_attrs.entry_info.length; i++) {
              if (this.table_attrs.entry_info[i].is_suspended) {
                this.table_attrs.entry_info[i].function = {
                  icon: 'fa-solid fa-play',
                  action: (i: any) => {
                    this.elevated_user(i);
                  },
                };
              } else {
                this.table_attrs.entry_info[i].function = {
                  icon: 'fa-solid fa-pause',
                  action: (i: any) => {
                    this.suspend_user(i);
                  },
                };
              }
            }
          }
        }

        this.entry_info_backup = this.table_attrs.entry_info;
      },
      error: async (err) => {
        this.parse_error_msg(err);
        await this.display_alert(false);
      },
    });
  }

  /**
   * It suspends a user and changes the icon of the action button to a play button.
   * @param {any} i - any -&gt; the index of the user in the table
   */
  suspend_user(i: any) {
    if (
      confirm(
        'Are you sure you want to suspend this user?\nAll its tools are going to be depricated.'
      )
    ) {
      this.userService
        .suspendUser(this.table_attrs.entry_info[i]._id)
        .subscribe({
          next: async (data) => {
            this.action_msg = data.message;

            this.table_attrs.entry_info[i].function = <actions_metadata_t>{
              icon: 'fa-solid fa-play',
              action: (i: any) => {
                this.elevated_user(i);
              },
            };

            this.entry_info_backup = this.table_attrs.entry_info;
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
   * It's a function that takes in a number and if the user confirms the action, it will call a service
   * function that will make a request to the server to elevate the user. If the request is successful,
   * it will change the icon and action of the button. If the request is unsuccessful, it will display
   * an error message.
   *
   * I'm trying to write a test for this function. I'm using Jasmine and Karma. I'm not sure how to
   * write a test for this function. I'm not sure how to test the if statement, the subscribe function,
   * and the async/await. I'm not sure how to test the service function. I'm not sure how to test the
   * request to the server. I'm not sure how to test the error message. I'm not sure how to test the
   * icon and action of the button.
   *
   * I'm not sure how to test this function. I'm not sure how to test
   * @param {any} i - any - the index of the user in the table
   */
  elevated_user(i: any) {
    if (confirm('Are you sure you want to elevate this user?')) {
      this.userService
        .elevatedUser(this.table_attrs.entry_info[i]._id)
        .subscribe({
          next: async (data) => {
            this.action_msg = data.message;

            this.table_attrs.entry_info[i].function = <actions_metadata_t>{
              icon: 'fa-solid fa-pause',
              action: (i: any) => {
                this.suspend_user(i);
              },
            };

            this.entry_info_backup = this.table_attrs.entry_info;
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
   * It deletes a user from the database and the table.
   * </code>
   * @param {any} i - any - the index of the user in the table
   */
  delete_user(i: any) {
    if (
      confirm(
        'Are you sure you want to DELETE this user?\nAll its related tools are going to lose.'
      )
    ) {
      this.userService
        .deleteUser(this.table_attrs.entry_info[i]._id)
        .subscribe({
          next: async (data) => {
            this.action_msg = data.message;
            let tmp_obj = this.table_attrs.entry_info.splice(i, 1)[0];
            let index = this.table_attrs.entry_info.indexOf(tmp_obj);
            if (index > -1) {
              this.entry_info_backup.splice(index, 1);
            }
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
   * The delay function returns a promise that resolves after a given number of seconds.
   * @param {number} sec - The number of seconds to wait before resolving the promise.
   * @returns A promise that resolves after sec seconds.
   */
  delay(sec: number) {
    return new Promise((resolve) => setTimeout(resolve, sec * 1000));
  }

  /**
   * If the action is successful, set the success flag to true, set the failure flag to false, wait 3
   * seconds, set the success flag to false, wait 3 seconds, and clear the action message.
   *
   * If the action is not successful, set the failure flag to true, set the success flag to false, wait
   * 3 seconds, set the failure flag to false, wait 3 seconds, and clear the action message.
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

  /**
   * It takes a string, replaces all non-alphanumeric characters with spaces, splits the string into an
   * array of words, adds parentheses to each word, joins the words back into a string, and then uses
   * that string to create a regex pattern.
   * </code>
   */
  search_regex() {
    if (this.search_pattern) {
      this.table_attrs.entry_info = [];
      let search_pattern = this.search_pattern.replace(',', ' ');
      search_pattern = search_pattern.replace('  ', ' ');
      search_pattern = search_pattern
        .replace(/['",:\[\]\{\}_ ]/g, ' ')
        .toLowerCase();
      let words = search_pattern.split(' ');

      for (let i = 0; i < words.length; i++) {
        words[i] = '(' + words[i] + ')';
      }

      let pattern_ = words.join('|');
      const pat = new RegExp(pattern_);
      for (let i = 0; i < this.entry_info_backup.length; i++) {
        if (
          JSON.stringify(this.entry_info_backup[i])
            .replace(/['",:\[\]\{\}_ ]/g, '')
            .toLowerCase()
            .search(pat) !== -1
        ) {
          this.table_attrs.entry_info.push(this.entry_info_backup[i]);
        }
      }
    } else {
      this.table_attrs.entry_info = this.entry_info_backup;
    }
  }
}
/**
 * It takes an index of an item in an array, and then removes that item from the array and adds it to
 * another array.
 * </code>
 * @param {any} i - any = index of the request in the array
 */
