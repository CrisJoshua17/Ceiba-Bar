import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuSnackComponent } from './menu-snack.component';

describe('MenuSnackComponent', () => {
  let component: MenuSnackComponent;
  let fixture: ComponentFixture<MenuSnackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuSnackComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenuSnackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
