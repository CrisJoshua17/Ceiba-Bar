import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarPaymentComponent } from './navbar-payment.component';

describe('NavbarPaymentComponent', () => {
  let component: NavbarPaymentComponent;
  let fixture: ComponentFixture<NavbarPaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarPaymentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavbarPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
