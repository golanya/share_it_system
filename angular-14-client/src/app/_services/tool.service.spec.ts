import { TestBed } from '@angular/core/testing';

import { ToolServiceService } from './tool.service';

describe('ToolServiceService', () => {
  let service: ToolServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToolServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
