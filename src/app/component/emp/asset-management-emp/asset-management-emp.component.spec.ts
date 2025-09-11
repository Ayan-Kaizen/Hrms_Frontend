import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetManagementEmpComponent } from './asset-management-emp.component';

describe('AssetManagementEmpComponent', () => {
  let component: AssetManagementEmpComponent;
  let fixture: ComponentFixture<AssetManagementEmpComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AssetManagementEmpComponent]
    });
    fixture = TestBed.createComponent(AssetManagementEmpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
