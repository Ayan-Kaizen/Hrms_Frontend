import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentProfileComponent } from './current-profile.component';

describe('CurrentProfileComponent', () => {
  let component: CurrentProfileComponent;
  let fixture: ComponentFixture<CurrentProfileComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CurrentProfileComponent]
    });
    fixture = TestBed.createComponent(CurrentProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
