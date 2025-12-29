import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuRecetarioComponent } from './menu-recetario.component';

describe('MenuRecetarioComponent', () => {
  let component: MenuRecetarioComponent;
  let fixture: ComponentFixture<MenuRecetarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuRecetarioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenuRecetarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
