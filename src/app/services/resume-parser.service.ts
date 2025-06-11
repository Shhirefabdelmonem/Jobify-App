import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { affindaConfig } from '../env/affinda.config';

// Affinda API response interface
export interface AffindaDocumentResponse {
  data: {
    name?: { raw?: string; first?: string; last?: string };
    phoneNumber?: Array<{ rawText: string }>;
    emailAddress?: Array<{ rawText: string }>;
    website?: Array<{ rawText: string; type?: string }>;
    skill?: Array<{ raw?: string; parsed?: string; name?: string }>;
    workExperience?: Array<any>;
    education?: Array<any>;
    rawText?: string;
  };
  meta: {
    ready: boolean;
    failed: boolean;
  };
  error?: {
    errorCode?: string;
    errorDetail?: string;
  };
}

// Profile data structure
export interface ParsedProfileData {
  personal: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    linkedin: string;
    github: string;
    portfolio: string;
  };
  educations: Array<{
    schoolName: string;
    major: string;
    degreeType: string;
    gpa: string;
    startDate: string;
    endDate: string;
  }>;
  experiences: Array<{
    jobTitle: string;
    company: string;
    jobType: string;
    location: string;
    startDate: string;
    endDate: string;
    summary: string;
  }>;
  skills: Array<{ skillName: string }>;
}

export interface ResumeParseResponse {
  success: boolean;
  message: string;
  data?: ParsedProfileData;
}

@Injectable({
  providedIn: 'root',
})
export class ResumeParserService {
  private readonly AFFINDA_API_URL = affindaConfig.apiUrl;
  private readonly AFFINDA_API_KEY = affindaConfig.apiKey;
  private readonly WORKSPACE_IDENTIFIER = affindaConfig.workspaceIdentifier;
  private readonly DOCUMENT_TYPE_IDENTIFIER =
    affindaConfig.documentTypeIdentifier;

  constructor(private http: HttpClient) {}

  /**
   * Parse a resume file using Affinda API
   */
  parseResume(file: File): Observable<ResumeParseResponse> {
    if (!this.AFFINDA_API_KEY) {
      return throwError(
        () =>
          new Error(
            'Affinda API key not configured. Please contact administrator.'
          )
      );
    }

    if (!this.WORKSPACE_IDENTIFIER) {
      return throwError(
        () =>
          new Error('Workspace not configured. Please contact administrator.')
      );
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('workspace', this.WORKSPACE_IDENTIFIER);
    if (this.DOCUMENT_TYPE_IDENTIFIER) {
      formData.append('documentType', this.DOCUMENT_TYPE_IDENTIFIER);
    }
    formData.append('wait', 'true');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.AFFINDA_API_KEY}`,
    });

    return this.http
      .post<AffindaDocumentResponse>(
        `${this.AFFINDA_API_URL}/documents`,
        formData,
        { headers }
      )
      .pipe(
        map((response: AffindaDocumentResponse) =>
          this.mapResponseToProfileData(response)
        ),
        catchError((error) => {
          let errorMessage =
            'Failed to parse resume. Please try again or fill the form manually.';

          if (error.status === 401) {
            errorMessage =
              'Authentication failed. Please check your API key configuration.';
          } else if (error.status === 400) {
            errorMessage =
              'Invalid request. Please check the file format and try again.';
          } else if (error.status === 429) {
            errorMessage = 'Rate limit exceeded. Please try again later.';
          } else if (error.status === 403) {
            errorMessage =
              'Access denied. Please check your workspace and document type configuration.';
          }

          return throwError(() => ({
            success: false,
            message: errorMessage,
            error,
          }));
        })
      );
  }

  /**
   * Validate file before upload
   */
  validateResumeFile(file: File): { valid: boolean; message: string } {
    if (!affindaConfig.allowedFileTypes.includes(file.type)) {
      return {
        valid: false,
        message:
          'Please upload a PDF, Word document, or image file (JPEG, PNG, TIFF).',
      };
    }

    if (file.size > affindaConfig.maxFileSize) {
      return {
        valid: false,
        message: 'File size must be less than 10MB.',
      };
    }

    return { valid: true, message: 'File is valid for parsing.' };
  }

  /**
   * Map Affinda API response to profile data structure
   */
  private mapResponseToProfileData(
    response: AffindaDocumentResponse
  ): ResumeParseResponse {
    try {
      // Check for errors in response
      if (response.error?.errorCode || response.error?.errorDetail) {
        return {
          success: false,
          message: `Resume parsing failed: ${
            response.error.errorDetail || 'Unknown error'
          }`,
        };
      }

      if (!response.meta.ready || response.meta.failed || !response.data) {
        return {
          success: false,
          message: 'Resume parsing failed. Please try a different file.',
        };
      }

      const data = response.data;

      // Extract personal information
      const personal = this.extractPersonalInfo(data);

      // Extract skills and combine with raw text skills
      let skills = this.extractSkills(data);

      // Extract education and experience (basic extraction)
      let educations = this.extractEducation(data);
      let experiences = this.extractExperience(data);

      // Fallback to raw text extraction if no structured data found
      if (data.rawText) {
        if (!personal.firstName && !personal.email) {
          const extracted = this.extractFromRawText(data.rawText);
          Object.assign(personal, extracted);
        }

        // Combine structured skills with raw text skills
        const rawTextSkills = this.extractSkillsFromRawText(data.rawText);
        skills = this.deduplicateSkills([...skills, ...rawTextSkills]);

        if (educations.length === 0) {
          educations = this.extractEducationFromRawText(data.rawText);
        }

        if (experiences.length === 0) {
          experiences = this.extractExperienceFromRawText(data.rawText);
        }
      } else {
        // Ensure skills are unique even if only from structured data
        skills = this.deduplicateSkills(skills);
      }

      return {
        success: true,
        message: 'Resume parsed successfully!',
        data: { personal, educations, experiences, skills },
      };
    } catch (error) {
      return {
        success: false,
        message:
          'Failed to process parsed resume data. Please fill the form manually.',
      };
    }
  }

  /**
   * Remove duplicate skills (case-insensitive comparison)
   */
  private deduplicateSkills(
    skills: Array<{ skillName: string }>
  ): Array<{ skillName: string }> {
    const seen = new Set<string>();
    const uniqueSkills: Array<{ skillName: string }> = [];

    for (const skill of skills) {
      const normalizedSkillName = skill.skillName.toLowerCase().trim();

      // Skip empty or very short skills
      if (normalizedSkillName.length <= 1) {
        continue;
      }

      // Check if we've already seen this skill (case-insensitive)
      if (!seen.has(normalizedSkillName)) {
        seen.add(normalizedSkillName);
        uniqueSkills.push({
          skillName: skill.skillName.trim(), // Keep original case
        });
      }
    }

    return uniqueSkills;
  }

  private extractPersonalInfo(data: any) {
    // Extract name
    let firstName = data.name?.first || '';
    let lastName = data.name?.last || '';

    if (!firstName && !lastName && data.name?.raw) {
      const nameParts = data.name.raw.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }

    // Extract contact info
    const email = data.emailAddress?.[0]?.rawText || '';
    const phone = data.phoneNumber?.[0]?.rawText || '';

    // Extract social links
    const websites = data.website || [];
    const linkedin = this.extractUrl(websites, 'linkedin.com');
    const github = this.extractUrl(websites, 'github.com');
    const portfolio =
      websites.find(
        (site: any) =>
          site.rawText &&
          !site.rawText.includes('linkedin.com') &&
          !site.rawText.includes('github.com')
      )?.rawText || '';

    return { firstName, lastName, email, phone, linkedin, github, portfolio };
  }

  private extractSkills(data: any): Array<{ skillName: string }> {
    if (!data.skill || data.skill.length === 0) return [];

    return data.skill
      .map((skill: any) => skill.raw || skill.parsed?.name || skill.name || '')
      .filter(
        (skillName: string) =>
          skillName &&
          skillName.length > 1 &&
          skillName.length < 50 &&
          !skillName.includes('http') &&
          !skillName.includes('.com')
      )
      .map((skillName: string) => ({ skillName: skillName.trim() }));
  }

  private extractEducation(data: any): Array<any> {
    if (!data.education || data.education.length === 0) return [];

    return data.education.map((edu: any) => ({
      schoolName: edu.raw || edu.parsed || '',
      major: '',
      degreeType: '',
      gpa: '',
      startDate: '',
      endDate: '',
    }));
  }

  private extractExperience(data: any): Array<any> {
    if (!data.workExperience || data.workExperience.length === 0) return [];

    return data.workExperience.map((exp: any) => ({
      jobTitle: exp.raw || exp.parsed || '',
      company: '',
      jobType: 'Full-time',
      location: '',
      startDate: '',
      endDate: '',
      summary: '',
    }));
  }

  private extractUrl(websites: any[], domain: string): string {
    return (
      websites.find((site) => site.rawText?.toLowerCase().includes(domain))
        ?.rawText || ''
    );
  }

  private extractFromRawText(rawText: string) {
    const lines = rawText.split('\n');
    const result = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      linkedin: '',
      github: '',
    };

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Extract email
      if (!result.email) {
        const emailMatch = trimmedLine.match(/[\w.-]+@[\w.-]+\.\w+/);
        if (emailMatch) result.email = emailMatch[0];
      }

      // Extract phone
      if (!result.phone) {
        const phoneMatch = trimmedLine.match(/[\+]?[\d\s\-\(\)]{10,}/);
        if (phoneMatch && phoneMatch[0].replace(/\D/g, '').length >= 10) {
          result.phone = phoneMatch[0].trim();
        }
      }

      // Extract social links
      if (
        !result.linkedin &&
        trimmedLine.toLowerCase().includes('linkedin.com')
      ) {
        const match = trimmedLine.match(/https?:\/\/[^\s]+linkedin[^\s]*/i);
        if (match) result.linkedin = match[0];
      }

      if (!result.github && trimmedLine.toLowerCase().includes('github.com')) {
        const match = trimmedLine.match(/https?:\/\/[^\s]+github[^\s]*/i);
        if (match) result.github = match[0];
      }

      // Extract name (first meaningful line)
      if (
        !result.firstName &&
        trimmedLine.length > 0 &&
        !trimmedLine.includes('@') &&
        !trimmedLine.includes('http') &&
        trimmedLine.length < 50
      ) {
        const nameParts = trimmedLine.split(' ');
        if (nameParts.length >= 2) {
          result.firstName = nameParts[0];
          result.lastName = nameParts.slice(1).join(' ');
        }
      }
    }

    return result;
  }

  private extractSkillsFromRawText(
    rawText: string
  ): Array<{ skillName: string }> {
    const skills: Array<{ skillName: string }> = [];
    const lines = rawText.split('\n');
    let inSkillsSection = false;

    for (const line of lines) {
      const trimmedLine = line.trim().toLowerCase();

      if (
        trimmedLine.includes('skills') ||
        trimmedLine.includes('programming languages') ||
        trimmedLine.includes('technical skills') ||
        trimmedLine.includes('technologies')
      ) {
        inSkillsSection = true;
        continue;
      }

      if (inSkillsSection) {
        if (
          trimmedLine.includes('experience') ||
          trimmedLine.includes('education') ||
          trimmedLine.includes('projects') ||
          trimmedLine.includes('certifications')
        ) {
          break;
        }

        if (line.trim().length > 0) {
          const skillsInLine = line
            .trim()
            .split(/[,;:|•\-\n\t]/)
            .map((s) => s.trim())
            .filter((s) => s.length > 1 && s.length < 50) // More reasonable length limits
            .filter((s) => !s.toLowerCase().includes('skills'))
            .filter((s) => !s.toLowerCase().includes('programming'))
            .filter((s) => !s.toLowerCase().includes('languages'))
            .filter((s) => !s.toLowerCase().includes('technologies'))
            .filter((s) => !/^\d+$/.test(s)) // Remove pure numbers
            .filter((s) => !/^[•\-\s]+$/.test(s)); // Remove bullet points and dashes

          for (const skill of skillsInLine) {
            if (skill && skill.trim().length > 1) {
              skills.push({ skillName: skill.trim() });
            }
          }
        }
      }
    }

    return skills;
  }

  private extractEducationFromRawText(rawText: string): Array<any> {
    const educations: Array<any> = [];
    const lines = rawText.split('\n');
    let inEducationSection = false;

    for (const line of lines) {
      const trimmedLine = line.trim().toLowerCase();

      if (
        trimmedLine.includes('education') ||
        trimmedLine.includes('university') ||
        trimmedLine.includes('college')
      ) {
        inEducationSection = true;
        continue;
      }

      if (
        inEducationSection &&
        (trimmedLine.includes('experience') || trimmedLine.includes('skills'))
      ) {
        break;
      }

      if (inEducationSection && line.trim().length > 10) {
        const education = {
          schoolName: line.trim(),
          major: '',
          degreeType: '',
          gpa: '',
          startDate: '',
          endDate: '',
        };

        if (trimmedLine.includes('bachelor') || trimmedLine.includes('b.s')) {
          education.degreeType = 'Bachelor';
        } else if (
          trimmedLine.includes('master') ||
          trimmedLine.includes('m.s')
        ) {
          education.degreeType = 'Master';
        }

        educations.push(education);
        if (educations.length >= 3) break;
      }
    }

    return educations;
  }

  private extractExperienceFromRawText(rawText: string): Array<any> {
    const experiences: Array<any> = [];
    const lines = rawText.split('\n');
    let inExperienceSection = false;

    for (const line of lines) {
      const trimmedLine = line.trim().toLowerCase();

      if (
        trimmedLine.includes('experience') ||
        trimmedLine.includes('work') ||
        trimmedLine.includes('employment')
      ) {
        inExperienceSection = true;
        continue;
      }

      if (
        inExperienceSection &&
        (trimmedLine.includes('education') || trimmedLine.includes('skills'))
      ) {
        break;
      }

      if (inExperienceSection && line.trim().length > 10) {
        experiences.push({
          jobTitle: line.trim(),
          company: '',
          jobType: 'Full-time',
          location: '',
          startDate: '',
          endDate: '',
          summary: '',
        });

        if (experiences.length >= 3) break;
      }
    }

    return experiences;
  }
}
