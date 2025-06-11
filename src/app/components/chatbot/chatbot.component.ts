import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatbotService, ChatMessage } from '../../services/chatbot.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.css',
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  @ViewChild('chatContainer') private chatContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;

  messages: ChatMessage[] = [];
  currentMessage: string = '';
  isLoading: boolean = false;
  isMinimized: boolean = true;

  constructor(private chatbotService: ChatbotService) {}

  ngOnInit() {
    this.addWelcomeMessage();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  addWelcomeMessage() {
    const welcomeMessage: ChatMessage = {
      id: this.generateId(),
      content: `👋 Hi! I'm your AI career assistant. I can help you with:
      
• Resume writing tips
• Interview preparation  
• Job market insights
• Career development advice

What would you like to know about your career journey?`,
      isUser: false,
      timestamp: new Date(),
    };
    this.messages.push(welcomeMessage);
  }

  toggleChat() {
    this.isMinimized = !this.isMinimized;
    if (!this.isMinimized) {
      setTimeout(() => {
        this.messageInput?.nativeElement?.focus();
      }, 100);
    }
  }

  sendMessage() {
    if (!this.currentMessage.trim() || this.isLoading) {
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: this.generateId(),
      content: this.currentMessage.trim(),
      isUser: true,
      timestamp: new Date(),
    };
    this.messages.push(userMessage);

    const messageToSend = this.currentMessage.trim();
    this.currentMessage = '';
    this.isLoading = true;

    // Send to backend
    this.chatbotService.sendMessage(messageToSend).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success && response.data) {
          const botMessage: ChatMessage = {
            id: this.generateId(),
            content: response.data.response,
            isUser: false,
            timestamp: new Date(),
          };
          this.messages.push(botMessage);
        } else {
          this.addErrorMessage(response.message || 'Failed to get response');
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Chat error:', error);
        this.addErrorMessage(
          'Sorry, I encountered an error. Please try again.'
        );
      },
    });
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  clearChat() {
    this.messages = [];
    this.addWelcomeMessage();
  }

  private addErrorMessage(message: string) {
    const errorMessage: ChatMessage = {
      id: this.generateId(),
      content: `❌ ${message}`,
      isUser: false,
      timestamp: new Date(),
    };
    this.messages.push(errorMessage);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private scrollToBottom(): void {
    try {
      if (this.chatContainer) {
        this.chatContainer.nativeElement.scrollTop =
          this.chatContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }
}
