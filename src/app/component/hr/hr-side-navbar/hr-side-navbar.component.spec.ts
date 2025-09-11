import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrSideNavbarComponent } from './hr-side-navbar.component';

describe('HrSideNavbarComponent', () => {
  let component: HrSideNavbarComponent;
  let fixture: ComponentFixture<HrSideNavbarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HrSideNavbarComponent]
    });
    fixture = TestBed.createComponent(HrSideNavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
