import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmpSideNavbarComponent } from './emp-side-navbar.component';

describe('EmpSideNavbarComponent', () => {
  let component: EmpSideNavbarComponent;
  let fixture: ComponentFixture<EmpSideNavbarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EmpSideNavbarComponent]
    });
    fixture = TestBed.createComponent(EmpSideNavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
