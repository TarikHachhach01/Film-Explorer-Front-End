import { Routes } from '@angular/router';
import { MovieSearchComponent } from './components/movie-search/movie-search';
import { MovieDetailComponent } from './components/movie-detail/movie-detail';
import { RegisterComponent } from './components/register/register';
import { LoginComponent } from './components/login/login';
import { WatchlistComponent } from './components/watchlist-component/watchlist-component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/movies',  // 👈 CHANGED
    pathMatch: 'full'
  },
  {
    path: 'movies',  // 👈 CHANGED (was 'search')
    component: MovieSearchComponent
  },
  {
    path: 'movies/:id',  // 👈 CHANGED (was 'movie/:id')
    component: MovieDetailComponent
  },
  {
    path: 'watchlist',
    component: WatchlistComponent
  },
  { 
    path: 'register', 
    component: RegisterComponent 
  },
  { 
    path: 'login', 
    component: LoginComponent 
  },
  {
    path: '**',
    redirectTo: '/movies'  // 👈 CHANGED
  }
];