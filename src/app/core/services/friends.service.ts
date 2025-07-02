import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { UserSearchResponse } from '../models/user.model';
import { Friendship, FriendRequestCreate } from '../models/friend.model';

@Injectable({
  providedIn: 'root'
})
export class FriendsService {
  constructor(private apiService: ApiService) {}
  
  getMyFriends(): Observable<UserSearchResponse[]> {
    return this.apiService.get<UserSearchResponse[]>('/friends');
  }
  
  getFriendRequests(): Observable<Friendship[]> {
    return this.apiService.get<Friendship[]>('/friends/requests');
  }
  
  sendFriendRequest(data: FriendRequestCreate): Observable<any> {
    return this.apiService.post('/friends/request', data);
  }
  
  acceptFriendRequest(friendshipId: number): Observable<any> {
    return this.apiService.put(`/friends/request/${friendshipId}/accept`, {});
  }
  
  rejectFriendRequest(friendshipId: number): Observable<any> {
    return this.apiService.put(`/friends/request/${friendshipId}/reject`, {});
  }
  
  removeFriend(userId: number): Observable<any> {
    return this.apiService.delete(`/friends/${userId}`);
  }
}