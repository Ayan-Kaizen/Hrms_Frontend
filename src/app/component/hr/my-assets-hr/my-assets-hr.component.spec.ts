import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyAssetsHrComponent } from './my-assets-hr.component';

describe('MyAssetsHrComponent', () => {
  let component: MyAssetsHrComponent;
  let fixture: ComponentFixture<MyAssetsHrComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MyAssetsHrComponent]
    });
    fixture = TestBed.createComponent(MyAssetsHrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
