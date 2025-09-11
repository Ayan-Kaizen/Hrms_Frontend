import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyWorkspaceComponent } from './my-workspace.component';

describe('MyWorkspaceComponent', () => {
  let component: MyWorkspaceComponent;
  let fixture: ComponentFixture<MyWorkspaceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MyWorkspaceComponent]
    });
    fixture = TestBed.createComponent(MyWorkspaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
