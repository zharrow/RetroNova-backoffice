import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ArcadeMachine, ArcadeMachineCreate, ArcadeMachineUpdate } from '../models/arcade-machine.model';

@Injectable({
  providedIn: 'root'
})
export class ArcadeMachinesService {
  constructor(private apiService: ApiService) {}
  
  getAllMachines(includeDeleted: boolean = false): Observable<ArcadeMachine[]> {
    return this.apiService.get<ArcadeMachine[]>('/arcades', { include_deleted: includeDeleted });
  }
  
  getMachineById(id: string, includeDeleted: boolean = false): Observable<ArcadeMachine> {
    return this.apiService.get<ArcadeMachine>(`/arcades/${id}`, { include_deleted: includeDeleted });
  }
  
  createMachine(machine: ArcadeMachineCreate): Observable<ArcadeMachine> {
    return this.apiService.post<ArcadeMachine>('/arcades', machine);
  }
  
  updateMachine(id: string, machine: ArcadeMachineUpdate): Observable<ArcadeMachine> {
    return this.apiService.put<ArcadeMachine>(`/arcades/${id}`, machine);
  }
  
  deleteMachine(id: string, hardDelete: boolean = false): Observable<any> {
    return this.apiService.delete(`/arcades/${id}`, { hard_delete: hardDelete });
  }
  
  restoreMachine(id: string): Observable<ArcadeMachine> {
    return this.apiService.post<ArcadeMachine>(`/arcades/${id}/restore`, {});
  }
  
  getGamesForMachine(id: string): Observable<any> {
    return this.apiService.get<any>(`/arcades/${id}/games`);
  }
}