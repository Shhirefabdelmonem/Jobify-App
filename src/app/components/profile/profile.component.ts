import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NavSidebarComponent } from '../nav-sidebar/nav-sidebar.component';
import { HeaderComponent } from '../header/header.component';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProfileService } from '../../services/profile.service';
import {
  ResumeParserService,
  ParsedProfileData,
} from '../../services/resume-parser.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    NavSidebarComponent,
    HeaderComponent,
    ReactiveFormsModule,
    CommonModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  @ViewChild('formSection') formSection!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  profileForm: FormGroup;
  isSubmitting = false;

  // Resume upload properties
  isParsingResume = false;
  selectedFile: File | null = null;
  uploadError: string | null = null;

  constructor(
    private _fb: FormBuilder,
    private profileService: ProfileService,
    private resumeParserService: ResumeParserService,
    private toastr: ToastrService
  ) {
    this.profileForm = this._fb.group({
      personal: this._fb.group({
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', Validators.required],
        linkedin: ['', Validators.pattern('https?://(www.)?linkedin.com/.*')],
        github: ['', Validators.pattern('https?://(www.)?github.com/.*')],
        portfolio: ['', Validators.pattern('https?://.*')],
      }),
      educations: this._fb.array([]),
      experiences: this._fb.array([]),
      skills: this._fb.array(
        [],
        [Validators.required, Validators.minLength(1)]
      ),
    });
  }

  // Getters for FormArrays
  get educations(): FormArray {
    return this.profileForm.get('educations') as FormArray;
  }

  get experiences(): FormArray {
    return this.profileForm.get('experiences') as FormArray;
  }

  get skills(): FormArray {
    return this.profileForm.get('skills') as FormArray;
  }

  // Education methods
  createEducation(): FormGroup {
    return this._fb.group({
      schoolName: ['', [Validators.required, Validators.minLength(3)]],
      major: ['', [Validators.required, Validators.minLength(2)]],
      degreeType: ['', Validators.required],
      gpa: ['', [Validators.min(0), Validators.max(4)]],
      startDate: ['', [Validators.required, this.futureDateValidator]],
      endDate: ['', this.endDateValidator],
    });
  }

  addEducation(): void {
    this.educations.push(this.createEducation());
  }

  removeEducation(index: number): void {
    this.educations.removeAt(index);
  }

  // Experience methods
  createExperience(): FormGroup {
    return this._fb.group({
      jobTitle: ['', Validators.required],
      company: ['', Validators.required],
      jobType: ['', Validators.required],
      location: [''],
      startDate: ['', [Validators.required, this.futureDateValidator]],
      endDate: ['', this.endDateValidator],
      summary: ['', Validators.maxLength(500)],
    });
  }

  addExperience(): void {
    this.experiences.push(this.createExperience());
  }

  removeExperience(index: number): void {
    this.experiences.removeAt(index);
  }

  // Skills methods
  createSkill(skillName: string, id?: number): FormGroup {
    return this._fb.group({
      id: [id || null],
      skillName: [skillName, [Validators.required, Validators.minLength(2)]],
    });
  }

  addSkill(skillName: string): void {
    if (skillName && skillName.trim()) {
      const trimmedSkill = skillName.trim();
      // Check if skill already exists
      const skillExists = this.skills.controls.some(
        (control) =>
          control.get('skillName')?.value.toLowerCase() ===
          trimmedSkill.toLowerCase()
      );

      if (!skillExists) {
        this.skills.push(this.createSkill(trimmedSkill));
      } else {
        this.toastr.warning('This skill has already been added');
      }
    }
  }

  removeSkill(index: number): void {
    this.skills.removeAt(index);
    // Mark the skills array as touched to show validation state
    this.skills.markAsTouched();
  }

  onSkillKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      const input = event.target as HTMLInputElement;
      this.addSkill(input.value);
      input.value = '';
    }
  }

  // Custom validators
  futureDateValidator(control: AbstractControl): { [key: string]: any } | null {
    if (!control.value) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inputDate = new Date(control.value);

    return inputDate > today ? { futureDate: true } : null;
  }

  endDateValidator(control: AbstractControl): { [key: string]: any } | null {
    if (!control.value) return null;

    const endDate = new Date(control.value);
    const startDateControl = control.parent?.get('startDate');

    if (startDateControl && startDateControl.value) {
      const startDate = new Date(startDateControl.value);
      return endDate < startDate ? { endDateBeforeStart: true } : null;
    }

    return null;
  }

  // Form submission
  updateProfile(): void {
    if (this.profileForm.valid) {
      this.isSubmitting = true;

      // Transform the form data to match the backend's expected structure
      const formData = this.profileForm.value;

      // Map educations with IDs
      const mappedEducations = formData.educations.map((edu: any) => ({
        id: edu.id || null,
        schoolName: edu.schoolName,
        major: edu.major,
        degreeType: edu.degreeType,
        gpa: edu.gpa,
        startDate: edu.startDate,
        endDate: edu.endDate,
      }));

      // Map experiences with IDs
      const mappedExperiences = formData.experiences.map((exp: any) => ({
        id: exp.id || null,
        jobTitle: exp.jobTitle,
        company: exp.company,
        jobType: exp.jobType,
        location: exp.location,
        startDate: exp.startDate,
        endDate: exp.endDate,
        summary: exp.summary,
      }));

      // Map skills with IDs
      const mappedSkills = formData.skills.map((skill: any) => ({
        id: skill.id || null,
        skillName: skill.skillName,
      }));

      const transformedData = {
        firstName: formData.personal.firstName,
        lastName: formData.personal.lastName,
        email: formData.personal.email,
        phone: formData.personal.phone,
        linkedin: formData.personal.linkedin,
        github: formData.personal.github,
        portfolio: formData.personal.portfolio,
        educations: mappedEducations,
        experiences: mappedExperiences,
        skills: mappedSkills,
      };

      this.profileService.updateProfile(transformedData).subscribe({
        next: (response) => {
          if (response.success) {
            this.toastr.success('Profile updated successfully');
          } else {
            this.toastr.error(response.message || 'Failed to update profile');
          }
        },
        error: (error) => {
          this.toastr.error(
            error.message || 'An error occurred while updating profile'
          );
        },
        complete: () => {
          this.isSubmitting = false;
        },
      });
    } else {
      this.markFormGroupTouched(this.profileForm);
      if (this.skills.length === 0) {
        this.toastr.error('Please add at least one skill');
      } else {
        this.toastr.error('Please fill in all required fields correctly');
      }
    }
  }

  // Helper to mark all controls as touched
  markFormGroupTouched(formGroup: FormGroup | FormArray): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();

      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }

  addNewEducation() {
    this.addEducation();
    this.scrollToSection('education');
  }

  ngOnInit(): void {
    // Set the first tab as active by default
    this.setActiveTab('personal');

    // Add initial empty forms
    this.addEducation();
    this.addExperience();

    // Load existing profile data
    this.loadProfile();
  }

  private loadProfile(): void {
    this.profileService.getProfile().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.populateForm(response.data);
        }
      },
      error: (error) => {
        this.toastr.error('Failed to load profile data');
      },
    });
  }

  private populateForm(data: any): void {
    if (data.personal) {
      this.profileForm.patchValue({
        personal: data.personal,
      });
    } else {
      // Map backend data format to frontend form structure
      this.profileForm.patchValue({
        personal: {
          firstName: data.firstName || data.FirstName,
          lastName: data.lastName || data.LastName,
          email: data.email || data.Email,
          phone: data.phone || data.Phone,
          linkedin: data.linkedIn || data.LinkedIn || data.linkedin,
          github: data.gitHub || data.GitHub || data.github,
          portfolio: data.portfolio || data.Portfolio,
        },
      });
    }

    if (data.educations && Array.isArray(data.educations)) {
      this.educations.clear();
      data.educations.forEach((edu: any) => {
        const educationGroup = this._fb.group({
          id: [edu.id],
          schoolName: [
            edu.schoolName,
            [Validators.required, Validators.minLength(3)],
          ],
          major: [edu.major, [Validators.required, Validators.minLength(2)]],
          degreeType: [edu.degreeType, Validators.required],
          gpa: [edu.gpa, [Validators.min(0), Validators.max(4)]],
          startDate: [
            this.formatDateForInput(edu.startDate),
            [Validators.required, this.futureDateValidator],
          ],
          endDate: [
            this.formatDateForInput(edu.endDate),
            this.endDateValidator,
          ],
        });
        this.educations.push(educationGroup);
      });
    } else if (data.Educations && Array.isArray(data.Educations)) {
      this.educations.clear();
      data.Educations.forEach((edu: any) => {
        const educationGroup = this._fb.group({
          id: [edu.id],
          schoolName: [
            edu.schoolName,
            [Validators.required, Validators.minLength(3)],
          ],
          major: [edu.major, [Validators.required, Validators.minLength(2)]],
          degreeType: [edu.degreeType, Validators.required],
          gpa: [edu.gpa, [Validators.min(0), Validators.max(4)]],
          startDate: [
            this.formatDateForInput(edu.startDate),
            [Validators.required, this.futureDateValidator],
          ],
          endDate: [
            this.formatDateForInput(edu.endDate),
            this.endDateValidator,
          ],
        });
        this.educations.push(educationGroup);
      });
    }

    if (data.experiences && Array.isArray(data.experiences)) {
      this.experiences.clear();
      data.experiences.forEach((exp: any) => {
        const experienceGroup = this._fb.group({
          id: [exp.id],
          jobTitle: [exp.jobTitle, Validators.required],
          company: [exp.company, Validators.required],
          jobType: [exp.jobType, Validators.required],
          location: [exp.location],
          startDate: [
            this.formatDateForInput(exp.startDate),
            [Validators.required, this.futureDateValidator],
          ],
          endDate: [
            this.formatDateForInput(exp.endDate),
            this.endDateValidator,
          ],
          summary: [exp.summary, Validators.maxLength(500)],
        });
        this.experiences.push(experienceGroup);
      });
    } else if (data.Experiences && Array.isArray(data.Experiences)) {
      this.experiences.clear();
      data.Experiences.forEach((exp: any) => {
        const experienceGroup = this._fb.group({
          id: [exp.id],
          jobTitle: [exp.jobTitle, Validators.required],
          company: [exp.company, Validators.required],
          jobType: [exp.jobType, Validators.required],
          location: [exp.location],
          startDate: [
            this.formatDateForInput(exp.startDate),
            [Validators.required, this.futureDateValidator],
          ],
          endDate: [
            this.formatDateForInput(exp.endDate),
            this.endDateValidator,
          ],
          summary: [exp.summary, Validators.maxLength(500)],
        });
        this.experiences.push(experienceGroup);
      });
    }

    if (data.skills && Array.isArray(data.skills)) {
      this.skills.clear();
      data.skills.forEach((skill: any) => {
        this.skills.push(this.createSkill(skill.skillName, skill.id));
      });
    } else if (data.Skills && Array.isArray(data.Skills)) {
      this.skills.clear();
      data.Skills.forEach((skill: any) => {
        this.skills.push(
          this.createSkill(
            skill.SkillName || skill.skillName,
            skill.id || skill.Id
          )
        );
      });
    }
  }

  // Helper method to format date for HTML input
  private formatDateForInput(dateString: string): string {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      // Format as YYYY-MM-DD for HTML date input
      return date.toISOString().split('T')[0];
    } catch (error) {
      return '';
    }
  }

  scrollToSection(sectionId: string): void {
    // Find the section element
    const section = document.getElementById(sectionId);
    if (section) {
      // Scroll to the section
      section.scrollIntoView({ behavior: 'smooth' });

      // Show the selected section
      this.showSection(sectionId);

      // Set the active tab
      this.setActiveTab(sectionId);
    }
  }

  private showSection(sectionId: string): void {
    // Hide all sections
    const sections = document.querySelectorAll('.form-content');
    sections.forEach((section) => {
      (section as HTMLElement).style.display = 'none';
    });

    // Show the selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
      selectedSection.style.display = 'block';
    }
  }

  private setActiveTab(sectionId: string): void {
    // Remove active class from all tabs
    const tabs = document.querySelectorAll('.tab-button');
    tabs.forEach((tab) => {
      tab.classList.remove('active');
    });

    // Find the index of the section
    const sectionIds = ['personal', 'education', 'experience', 'skills'];
    const index = sectionIds.indexOf(sectionId);

    // Add active class to the selected tab
    if (index >= 0 && index < tabs.length) {
      tabs[index].classList.add('active');
    }
  }

  // Resume upload methods
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validate file
      const validation = this.resumeParserService.validateResumeFile(file);
      if (!validation.valid) {
        this.uploadError = validation.message;
        this.selectedFile = null;
        this.toastr.error(validation.message);
        return;
      }

      this.selectedFile = file;
      this.uploadError = null;
      this.toastr.info(`Selected file: ${file.name}`);
    }
  }

  uploadAndParseResume(): void {
    if (!this.selectedFile) {
      this.toastr.warning('Please select a resume file first.');
      return;
    }

    // Confirm before parsing (will overwrite existing data)
    if (this.profileForm.dirty) {
      const confirmOverwrite = confirm(
        'Parsing a resume will overwrite any existing form data. Do you want to continue?'
      );
      if (!confirmOverwrite) {
        return;
      }
    }

    this.isParsingResume = true;
    this.uploadError = null;

    this.resumeParserService.parseResume(this.selectedFile).subscribe({
      next: (response) => {
        this.isParsingResume = false;

        if (response.success && response.data) {
          this.autoFillFormWithParsedData(response.data);
          this.toastr.success(
            response.message || 'Resume parsed successfully!'
          );
          this.clearFileInput();
        } else {
          this.uploadError = response.message;
          this.toastr.error(response.message);
        }
      },
      error: (error) => {
        this.isParsingResume = false;
        this.uploadError =
          'Failed to parse resume. Please try again or fill the form manually.';
        this.toastr.error(this.uploadError);
        console.error('Resume parsing error:', error);
      },
    });
  }

  autoFillFormWithParsedData(data: ParsedProfileData): void {
    try {
      // Clear existing form arrays
      this.clearFormArrays();

      // Fill personal information
      this.profileForm.get('personal')?.patchValue(data.personal);

      // Fill educations
      data.educations.forEach((education) => {
        const educationForm = this.createEducation();
        educationForm.patchValue(education);
        this.educations.push(educationForm);
      });

      // Fill experiences
      data.experiences.forEach((experience) => {
        const experienceForm = this.createExperience();
        experienceForm.patchValue(experience);
        this.experiences.push(experienceForm);
      });

      // Fill skills
      data.skills.forEach((skill) => {
        if (skill.skillName && skill.skillName.trim()) {
          this.skills.push(this.createSkill(skill.skillName.trim()));
        }
      });

      // Add default entries if arrays are empty
      if (this.educations.length === 0) {
        this.addEducation();
      }
      if (this.experiences.length === 0) {
        this.addExperience();
      }

      // Mark form as touched to show validation states
      this.profileForm.markAsTouched();

      this.toastr.info(
        'Profile auto-filled from resume. Please review and update as needed.'
      );
    } catch (error) {
      console.error('Error auto-filling form:', error);
      this.toastr.error(
        'Error auto-filling form. Please check the data and try again.'
      );
    }
  }

  clearFormArrays(): void {
    // Clear educations
    while (this.educations.length !== 0) {
      this.educations.removeAt(0);
    }

    // Clear experiences
    while (this.experiences.length !== 0) {
      this.experiences.removeAt(0);
    }

    // Clear skills
    while (this.skills.length !== 0) {
      this.skills.removeAt(0);
    }
  }

  clearFileInput(): void {
    this.selectedFile = null;
    this.uploadError = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  removeSelectedFile(): void {
    this.clearFileInput();
    this.toastr.info('File removed.');
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }
}
