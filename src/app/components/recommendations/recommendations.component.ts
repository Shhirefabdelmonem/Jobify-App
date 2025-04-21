import { Component } from '@angular/core';
import { NavSidebarComponent } from "../nav-sidebar/nav-sidebar.component";
import { HeaderComponent } from "../header/header.component";

@Component({
  selector: 'app-recommendations',
  imports: [NavSidebarComponent, HeaderComponent],
  templateUrl: './recommendations.component.html',
  styleUrl: './recommendations.component.css'
})
export class RecommendationsComponent {

  matchPercentage:number;
  constructor(){
    this.matchPercentage = 65;
  }
}
