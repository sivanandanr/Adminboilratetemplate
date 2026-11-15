import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SmartToastContainer } from './toast';
import { ToastService } from '../../core/feedback/toast.service';
describe('Toast top-layer outlet',()=>{
 it('opens one manual popover for messages and keeps it present above newly opened dialogs',async()=>{
  TestBed.configureTestingModule({providers:[provideZonelessChangeDetection()]});const fixture=TestBed.createComponent(SmartToastContainer);fixture.detectChanges();const toasts=TestBed.inject(ToastService);
  toasts.show({title:'Saved',durationMs:0});await fixture.whenStable();const aside=(fixture.nativeElement as HTMLElement).querySelector('aside')!;expect(aside.matches(':popover-open')).toBeTrue();
  const dialog=document.createElement('dialog');dialog.textContent='Details';document.body.append(dialog);
  try{dialog.showModal();fixture.changeDetectorRef.markForCheck();fixture.detectChanges();expect(aside.matches(':popover-open')).toBeTrue();expect(dialog.open).toBeTrue();toasts.dismissAll();await fixture.whenStable();expect(aside.matches(':popover-open')).toBeFalse();}
  finally{dialog.close();dialog.remove();fixture.destroy();}
 });
});
