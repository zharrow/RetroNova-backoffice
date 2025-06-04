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
    return this.apiService.get<ArcadeMachine[]>('/arcade_machines', { include_deleted: includeDeleted });
  }
  
  getMachineById(id: string, includeDeleted: boolean = false): Observable<ArcadeMachine> {
    return this.apiService.get<ArcadeMachine>(`/arcade_machines/${id}`, { include_deleted: includeDeleted });
  }
  
  createMachine(machine: ArcadeMachineCreate): Observable<ArcadeMachine> {
    return this.apiService.post<ArcadeMachine>('/arcade_machines', machine);
  }
  
  updateMachine(id: string, machine: ArcadeMachineUpdate): Observable<ArcadeMachine> {
    return this.apiService.put<ArcadeMachine>(`/arcade_machines/${id}`, machine);
  }
  
  deleteMachine(id: string, hardDelete: boolean = false): Observable<any> {
    return this.apiService.delete(`/arcade_machines/${id}`, { hard_delete: hardDelete });
  }
  
  restoreMachine(id: string): Observable<ArcadeMachine> {
    return this.apiService.post<ArcadeMachine>(`/arcade_machines/${id}/restore`, {});
  }
  
  getGamesForMachine(id: string): Observable<any> {
    return this.apiService.get<any>(`/arcade_machines/${id}/games`);
  }
}