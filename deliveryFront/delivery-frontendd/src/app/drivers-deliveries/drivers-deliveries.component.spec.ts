import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriversDeliveriesComponent } from './drivers-deliveries.component';

describe('DriversDeliveriesComponent', () => {
  let component: DriversDeliveriesComponent;
  let fixture: ComponentFixture<DriversDeliveriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriversDeliveriesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DriversDeliveriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
