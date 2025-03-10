import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SignUpComponent } from "./components/sign-up/sign-up.component";
import { ProfileComponent } from "./components/profile/profile.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SignUpComponent, ProfileComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Jobify-App';
}
