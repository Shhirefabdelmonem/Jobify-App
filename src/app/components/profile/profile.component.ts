import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NavSidebarComponent } from "../nav-sidebar/nav-sidebar.component";
import { HeaderComponent } from "../header/header.component";
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  imports: [NavSidebarComponent, HeaderComponent,ReactiveFormsModule,CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  @ViewChild('formSection') formSection!: ElementRef;
  profileForm:FormGroup;
  
  constructor(private _fb :FormBuilder) { 
    this.profileForm = this._fb.group({
      personal: this._fb.group({
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', Validators.required],
        linkedin: ['', Validators.pattern('https?://(www.)?linkedin.com/.*')],
        github: ['', Validators.pattern('https?://(www.)?github.com/.*')],
        portfolio: ['', Validators.pattern('https?://.*')]
      }),
      educations: this._fb.array([]),
      experiences: this._fb.array([]),
      skills: this._fb.array([])
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
      endDate: ['', this.endDateValidator]
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
      summary: ['', Validators.maxLength(500)]
    });
  }
  
  addExperience(): void {
    this.experiences.push(this.createExperience());
  }
  
  removeExperience(index: number): void {
    this.experiences.removeAt(index);
  }
  
  // Skills methods
  createSkill(skillName: string): FormGroup {
    return this._fb.group({
      skillName: [skillName, Validators.required]
    });
  }
  
  addSkill(skillName: string): void {
    if (skillName && skillName.trim()) {
      this.skills.push(this.createSkill(skillName.trim()));
    }
  }
  
  removeSkill(index: number): void {
    this.skills.removeAt(index);
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
  futureDateValidator(control: AbstractControl): {[key: string]: any} | null {
    if (!control.value) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inputDate = new Date(control.value);
    
    return inputDate > today ? { 'futureDate': true } : null;
  }
  
  endDateValidator(control: AbstractControl): {[key: string]: any} | null {
    if (!control.value) return null;
    
    const endDate = new Date(control.value);
    const startDateControl = control.parent?.get('startDate');
    
    if (startDateControl && startDateControl.value) {
      const startDate = new Date(startDateControl.value);
      return endDate < startDate ? { 'endDateBeforeStart': true } : null;
    }
    
    return null;
  }
  
  // Form submission
  updateProfile(): void {
    if (this.profileForm.valid) {
      console.log('Profile updated:', this.profileForm.value);
      // Here you would send the data to your backend
    } else {
      this.markFormGroupTouched(this.profileForm);
    }
  }
  
  // Helper to mark all controls as touched
  markFormGroupTouched(formGroup: FormGroup | FormArray): void {
    Object.values(formGroup.controls).forEach(control => {
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
    sections.forEach(section => {
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
    tabs.forEach(tab => {
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
}
