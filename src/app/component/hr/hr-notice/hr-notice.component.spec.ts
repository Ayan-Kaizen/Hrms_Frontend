import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrNoticeComponent } from './hr-notice.component';

describe('HrNoticeComponent', () => {
  let component: HrNoticeComponent;
  let fixture: ComponentFixture<HrNoticeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HrNoticeComponent]
    });
    fixture = TestBed.createComponent(HrNoticeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
