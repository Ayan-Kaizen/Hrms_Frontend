import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverallPerformanceComponent } from './overall-performance.component';

describe('OverallPerformanceComponent', () => {
  let component: OverallPerformanceComponent;
  let fixture: ComponentFixture<OverallPerformanceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OverallPerformanceComponent]
    });
    fixture = TestBed.createComponent(OverallPerformanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
