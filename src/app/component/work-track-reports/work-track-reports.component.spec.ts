import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkTrackReportsComponent } from './work-track-reports.component';

describe('WorkTrackReportsComponent', () => {
  let component: WorkTrackReportsComponent;
  let fixture: ComponentFixture<WorkTrackReportsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WorkTrackReportsComponent]
    });
    fixture = TestBed.createComponent(WorkTrackReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
