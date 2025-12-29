import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarDriverComponent } from './navbar-driver.component';

describe('NavbarDriverComponent', () => {
  let component: NavbarDriverComponent;
  let fixture: ComponentFixture<NavbarDriverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarDriverComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavbarDriverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
