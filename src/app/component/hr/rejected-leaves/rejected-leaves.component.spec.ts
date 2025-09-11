import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RejectedLeavesComponent } from './rejected-leaves.component';

describe('RejectedLeavesComponent', () => {
  let component: RejectedLeavesComponent;
  let fixture: ComponentFixture<RejectedLeavesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RejectedLeavesComponent]
    });
    fixture = TestBed.createComponent(RejectedLeavesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
