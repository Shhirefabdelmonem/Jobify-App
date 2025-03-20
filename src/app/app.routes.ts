import { Routes } from '@angular/router';
import { RecommendationsComponent } from './components/recommendations/recommendations.component';
import { ProfileComponent } from './components/profile/profile.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';

export const routes: Routes = [
    {path: 'recommendations',component:RecommendationsComponent},
    {path:'profile',component:ProfileComponent},
    {path:'sign-up',component:SignUpComponent},
    {path:'',redirectTo:'/sign-up',pathMatch:'full'}
];
