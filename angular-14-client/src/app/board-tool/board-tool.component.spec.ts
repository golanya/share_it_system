import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardToolComponent } from './board-tool.component';

describe('BoardToolComponent', () => {
  let component: BoardToolComponent;
  let fixture: ComponentFixture<BoardToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BoardToolComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoardToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
