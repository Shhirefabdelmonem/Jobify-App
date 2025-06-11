import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {
  ResumeParserService,
  ResumeParseResponse,
} from './resume-parser.service';
import { affindaConfig } from '../env/affinda.config';

describe('ResumeParserService', () => {
  let service: ResumeParserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ResumeParserService],
    });
    service = TestBed.inject(ResumeParserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should validate PDF files as valid', () => {
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const validation = service.validateResumeFile(file);
    expect(validation.valid).toBe(true);
  });

  it('should validate Word files as valid', () => {
    const file = new File(['test'], 'test.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const validation = service.validateResumeFile(file);
    expect(validation.valid).toBe(true);
  });

  it('should reject invalid file types', () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const validation = service.validateResumeFile(file);
    expect(validation.valid).toBe(false);
    expect(validation.message).toContain('PDF, Word document, or image file');
  });

  it('should reject files that are too large', () => {
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', {
      type: 'application/pdf',
    });
    const validation = service.validateResumeFile(largeFile);
    expect(validation.valid).toBe(false);
    expect(validation.message).toContain('10MB');
  });

  // Mock test for successful parsing (when API key is configured)
  it('should handle successful resume parsing', () => {
    if (!affindaConfig.apiKey) {
      // Skip this test if API key is not configured
      pending('API key not configured for testing');
      return;
    }

    const file = new File(['test resume content'], 'resume.pdf', {
      type: 'application/pdf',
    });
    const mockResponse = {
      meta: {
        identifier: 'test-id',
        ready: true,
        readyDt: '2024-01-01T00:00:00Z',
        fileName: 'resume.pdf',
        pages: 1,
        ocr: false,
      },
      data: {
        name: { first: 'John', last: 'Doe' },
        emails: [{ rawText: 'john.doe@example.com' }],
        phoneNumbers: [{ rawText: '+1234567890' }],
        skills: [{ name: 'JavaScript' }, { name: 'Angular' }],
        education: [],
        workExperience: [],
      },
    };

    service.parseResume(file).subscribe((response: ResumeParseResponse) => {
      expect(response.success).toBe(true);
      expect(response.data?.personal.firstName).toBe('John');
      expect(response.data?.personal.lastName).toBe('Doe');
      expect(response.data?.personal.email).toBe('john.doe@example.com');
    });

    const req = httpMock.expectOne(`${affindaConfig.apiUrl}/documents`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });
});
