import { Routes } from '@angular/router';
import { RecommendationsComponent } from './components/recommendations/recommendations.component';
import { ProfileComponent } from './components/profile/profile.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { SignInComponent } from './components/sign-in/sign-in.component';
import { HomeComponent } from './components/home/home.component';
import { TrackApplicationsComponent } from './components/track-applications/track-applications.component';
import { ChatbotComponent } from './components/chatbot/chatbot.component';

export const routes: Routes = [
    {path: 'recommendations',component:RecommendationsComponent},
    {path:'profile',component:ProfileComponent},
    {path:'applications',component:TrackApplicationsComponent},
    {path:'sign-up',component:SignUpComponent},
    {path:'sign-in',component:SignInComponent},
    {path:'home',component:HomeComponent},
    {path:'chatbot',component:ChatbotComponent},
    {path:'',redirectTo:'/home',pathMatch:'full'}
];
