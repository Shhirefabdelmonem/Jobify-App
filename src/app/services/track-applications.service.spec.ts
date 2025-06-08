import { TestBed } from '@angular/core/testing';

import { TrackApplicationsService } from './track-applications.service';

describe('TrackApplicationsService', () => {
  let service: TrackApplicationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrackApplicationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
