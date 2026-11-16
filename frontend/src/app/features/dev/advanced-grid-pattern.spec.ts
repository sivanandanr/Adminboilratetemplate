import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { provideRouter } from '@angular/router';
import { authTestProviders } from '../../core/auth/auth-test.providers';
import { initialGridRequest } from '../../shared/grid/grid.models';
import { AdvancedGridPattern } from './advanced-grid-pattern';

describe('Advanced grid pattern fixture',()=>{
 beforeEach(()=>TestBed.configureTestingModule({providers:[provideZonelessChangeDetection(),provideRouter([]),...authTestProviders()]}));
 it('provides bounded searchable rows to the shared grid without mutation actions',async()=>{
  const example=TestBed.runInInjectionContext(()=>new AdvancedGridPattern());
  const first=await firstValueFrom(example.source.load(initialGridRequest));
  expect(first.totalCount).toBe(1000);expect(first.items.length).toBe(10);
  const filtered=await firstValueFrom(example.source.load({...initialGridRequest,searchText:'Employee 00042'}));
  expect(filtered.items.length).toBe(1);expect(example.rowLabel(filtered.items[0])).toBe('Employee 00042');expect(example.actions.map(action=>action.id)).toEqual(['view']);
 });
});
