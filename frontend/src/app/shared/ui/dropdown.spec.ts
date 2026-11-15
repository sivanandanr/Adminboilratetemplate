import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SmartDropdown } from './dropdown';
@Component({imports:[SmartDropdown,ReactiveFormsModule],template:'<smart-dropdown label="Category" [formControl]="control" [options]="options()" />',changeDetection:ChangeDetectionStrategy.OnPush})
class DropdownHost {
 readonly control=new FormControl('technology');
 readonly options=signal<readonly {value:string;label:string}[]>([]);
}
describe('Dropdown model/option synchronization',()=>{
 it('displays a preselected value when options arrive and updates after a form reset',async()=>{
  TestBed.configureTestingModule({providers:[provideZonelessChangeDetection()]});const fixture=TestBed.createComponent(DropdownHost);fixture.detectChanges();
  fixture.componentInstance.options.set([{value:'technology',label:'Technology'},{value:'operations',label:'Operations'}]);fixture.detectChanges();await fixture.whenStable();
  const select=fixture.nativeElement.querySelector('select') as HTMLSelectElement;expect(select.value).toBe('technology');
  fixture.componentInstance.control.reset('operations');fixture.detectChanges();expect(select.value).toBe('operations');
  fixture.componentInstance.control.reset(null);fixture.detectChanges();expect(select.value).toBe('');
 });
});
