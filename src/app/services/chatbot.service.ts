import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../env/env.developmnet';

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export interface ChatRequest {
  message: string;
  context?: string;
}

export interface ChatResponse {
  success: boolean;
  message: string;
  data?: {
    response: string;
    conversationId?: string;
  };
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChatbotService {
  private readonly API_URL = `${environment.baseUrl}/api/Chatbot`;

  constructor(private http: HttpClient) {}

  sendMessage(
    message: string,
    context: string = 'career-guidance'
  ): Observable<ChatResponse> {
    const chatRequest: ChatRequest = {
      message: message,
      context: context,
    };

    return this.http
      .post<ChatResponse>(`${this.API_URL}/chat`, chatRequest)
      .pipe(
        catchError((error) => {
          console.error('Chatbot API error:', error);
          return throwError(() => error);
        })
      );
  }

  // Helper method to create system prompt for career guidance
  getCareerGuidancePrompt(): string {
    return `You are an AI career counselor and job search assistant. Help users with:
    - Resume writing and optimization tips
    - Interview preparation and common questions
    - Job market trends and industry insights
    - Career development advice
    - Skill recommendations for specific roles
    - Salary negotiation strategies
    - Professional networking tips
    
    Keep responses concise, practical, and actionable. Always maintain a supportive and professional tone.`;
  }
}
