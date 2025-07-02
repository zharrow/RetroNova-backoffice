import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PromosDetailsComponent } from './promos-details.component';

describe('PromosDetailsComponent', () => {
  let component: PromosDetailsComponent;
  let fixture: ComponentFixture<PromosDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PromosDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PromosDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
