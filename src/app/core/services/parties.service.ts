import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Party } from '../models/party.model';

@Injectable({
  providedIn: 'root'
})
export class PartiesService {
  constructor(private apiService: ApiService) {}
  
  getAllParties(includeDeleted: boolean = false): Observable<Party[]> {
    return this.apiService.get<Party[]>('/parties', { include_deleted: includeDeleted });
  }
  
  getActiveParties(): Observable<Party[]> {
    return this.apiService.get<Party[]>('/parties', { done: false, cancel: false });
  }
  
  getCompletedParties(): Observable<Party[]> {
    return this.apiService.get<Party[]>('/parties', { done: true });
  }
  
  getPartiesByMachine(machineId: string): Observable<Party[]> {
    return this.apiService.get<Party[]>('/parties', { machine_id: machineId });
  }
  
  getActivePartiesByMachine(machineId: string): Observable<Party[]> {
    return this.apiService.get<Party[]>('/parties', { machine_id: machineId, done: false, cancel: false });
  }
  
  getPartyById(id: string, includeDeleted: boolean = false): Observable<Party> {
    return this.apiService.get<Party>(`/parties/${id}`, { include_deleted: includeDeleted });
  }
}