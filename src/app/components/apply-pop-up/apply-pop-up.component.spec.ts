import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplyPopUpComponent } from './apply-pop-up.component';

describe('ApplyPopUpComponent', () => {
  let component: ApplyPopUpComponent;
  let fixture: ComponentFixture<ApplyPopUpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplyPopUpComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApplyPopUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
