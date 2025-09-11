import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewCredComponent } from './view-cred.component';

describe('ViewCredComponent', () => {
  let component: ViewCredComponent;
  let fixture: ComponentFixture<ViewCredComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ViewCredComponent]
    });
    fixture = TestBed.createComponent(ViewCredComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
