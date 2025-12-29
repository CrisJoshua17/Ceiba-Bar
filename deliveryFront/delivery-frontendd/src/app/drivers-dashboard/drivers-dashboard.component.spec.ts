import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriversDashboardComponent } from './drivers-dashboard.component';

describe('DriversDashboardComponent', () => {
  let component: DriversDashboardComponent;
  let fixture: ComponentFixture<DriversDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriversDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DriversDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
