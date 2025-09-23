import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyLeavesHrComponent } from './my-leaves-hr.component';

describe('MyLeavesHrComponent', () => {
  let component: MyLeavesHrComponent;
  let fixture: ComponentFixture<MyLeavesHrComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MyLeavesHrComponent]
    });
    fixture = TestBed.createComponent(MyLeavesHrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
