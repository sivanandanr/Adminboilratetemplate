import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GridPaginationComponent } from './grid-controls';
describe('Numbered grid pagination',()=>{
 it('jumps to a numbered page, highlights the current page and omits numbers for unknown totals',()=>{
  TestBed.configureTestingModule({providers:[provideZonelessChangeDetection()]});const fixture=TestBed.createComponent(GridPaginationComponent);
  fixture.componentRef.setInput('pageNumber',2);fixture.componentRef.setInput('pageSize',10);fixture.componentRef.setInput('count',10);fixture.componentRef.setInput('totalCount',10000);fixture.detectChanges();
  expect(fixture.nativeElement.querySelector('[aria-current="page"]').textContent.trim()).toBe('2');
  const changed=jasmine.createSpy();fixture.componentInstance.pageChanged.subscribe(changed);fixture.nativeElement.querySelector('[aria-label="Page 1000"]').click();expect(changed).toHaveBeenCalledWith(1000);
  fixture.componentRef.setInput('totalCount',null);fixture.detectChanges();expect(fixture.nativeElement.querySelector('[aria-current="page"]')).toBeNull();expect(fixture.nativeElement.textContent).toContain('total unknown');
 });
});
