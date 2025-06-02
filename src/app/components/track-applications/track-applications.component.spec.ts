import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackApplicationsComponent } from './track-applications.component';

describe('TrackApplicationsComponent', () => {
  let component: TrackApplicationsComponent;
  let fixture: ComponentFixture<TrackApplicationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackApplicationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackApplicationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
