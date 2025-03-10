import { Component } from '@angular/core';
import { NavSidebarComponent } from "../nav-sidebar/nav-sidebar.component";
import { HeaderComponent } from "../header/header.component";

@Component({
  selector: 'app-profile',
  imports: [NavSidebarComponent, HeaderComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {

}
