import { Component, Input, OnInit } from '@angular/core';
import {
  AUTO_STYLE,
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';

const DEFAULT_DURATION = 300;

export interface actions_metadata_t {
  icon: string;
  action: any;
}

export interface generic_table_attr {
  height?: string;
  headers: any;
  card_attrs: any;
  entry_info: any;
  is_collapsable: boolean;
}

@Component({
  selector: 'app-generic-table',
  templateUrl: './generic-table.component.html',
  styleUrls: ['./generic-table.component.css'],
  animations: [
    trigger('collapse', [
      state('false', style({ height: AUTO_STYLE, visibility: AUTO_STYLE })),
      state('true', style({ height: '0', visibility: 'hidden' })),
      transition('false => true', animate(DEFAULT_DURATION + 'ms ease-in')),
      transition('true => false', animate(DEFAULT_DURATION + 'ms ease-out')),
    ]),
  ],
})
export class GenericTableComponent implements OnInit {
  @Input() table_attrs: generic_table_attr = {} as generic_table_attr;
  @Input() functions?: Array<actions_metadata_t>;
  @Input() err_msg?: string;
  @Input() headers2model_attr: any;
  @Input() post_collaps_func?: Function;

  constructor() {}

  ngOnInit(): void {
    this.capitalize_all_entries();
  }

  /* Setting the show property of the entry_info object to false. */
  collapse(i: any) {
    this.table_attrs.entry_info[i].show = false;
  }

  expand(i: any, post_collaps_func?: Function) {
    this.table_attrs.entry_info[i].show = true;

        
    if (post_collaps_func){
      post_collaps_func(i);
    }
  }

  /**
   * It takes an array of objects, and capitalizes the first letter of each string value in each object
   */
  capitalize_all_entries() {
    for (let i = 0; i < this.table_attrs.entry_info.length; i++) {
      for (const [key, value] of Object.entries(
        this.table_attrs.entry_info[i]
      )) {
        if (typeof value === 'string' && value.length > 0 && key !== 'link') {
          this.table_attrs.entry_info[i][key] =
            value[0].toUpperCase() + value.slice(1);
        }
      }
    }
  }
}
