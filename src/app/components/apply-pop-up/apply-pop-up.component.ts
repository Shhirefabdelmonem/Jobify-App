import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ApplicationTrackingData {
  jobId?: string;
  jobTitle: string;
  company: string;
  applied: boolean;
  timestamp: Date;
}

@Component({
  selector: 'app-apply-pop-up',
  imports: [CommonModule],
  templateUrl: './apply-pop-up.component.html',
  styleUrl: './apply-pop-up.component.css',
})
export class ApplyPopUpComponent {
  @Input() isVisible: boolean = false;
  @Input() jobTitle: string = '';
  @Input() company: string = '';
  @Input() jobId?: string;

  @Output() applicationTracked = new EventEmitter<ApplicationTrackingData>();
  @Output() modalClosed = new EventEmitter<void>();

  onApplicationResponse(applied: boolean): void {
    const trackingData: ApplicationTrackingData = {
      jobId: this.jobId,
      jobTitle: this.jobTitle,
      company: this.company,
      applied: applied,
      timestamp: new Date(),
    };

    this.applicationTracked.emit(trackingData);
    this.closeModal();
  }

  closeModal(): void {
    this.isVisible = false;
    this.modalClosed.emit();
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }
}
