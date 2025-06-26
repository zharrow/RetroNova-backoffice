import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MachineFormComponent } from './machine-form.component';

describe('MachineFormComponent', () => {
  let component: MachineFormComponent;
  let fixture: ComponentFixture<MachineFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MachineFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MachineFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
