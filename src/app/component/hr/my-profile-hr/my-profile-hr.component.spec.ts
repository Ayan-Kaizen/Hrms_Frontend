import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyProfileHrComponent } from './my-profile-hr.component';

describe('MyProfileHrComponent', () => {
  let component: MyProfileHrComponent;
  let fixture: ComponentFixture<MyProfileHrComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MyProfileHrComponent]
    });
    fixture = TestBed.createComponent(MyProfileHrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
