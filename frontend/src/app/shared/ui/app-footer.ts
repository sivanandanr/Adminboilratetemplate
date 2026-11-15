import { RouterLink } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, inject } from '@angular/core';
import { APP_METADATA } from '../../core/app-metadata';
@Component({selector:'smart-app-footer',imports:[RouterLink],template:`<footer><span>© {{ year }} {{ metadata.product }}. All rights reserved.</span><div><span>v{{ metadata.version }} · {{ metadata.environment }}</span><nav aria-label="Legal and support">@for(link of metadata.links;track link.label){@if(safeHref(link.href);as href){@if(href.startsWith('/')){<a [routerLink]="href">{{link.label}}</a>}@else{<a [href]="href">{{link.label}}</a>}}@else{<span aria-disabled="true" [attr.title]="link.label + ' is not available yet'">{{ link.label }}</span>}}</nav></div></footer>`,styles:`:host{display:block;flex-shrink:0;}footer{min-height:var(--iam-app-footer-height);border-top:1px solid var(--iam-border);background:var(--iam-canvas);color:var(--iam-text-secondary);padding:4px var(--iam-space-4);display:flex;align-items:center;justify-content:space-between;gap:var(--iam-space-2);font-size:var(--iam-font-xs);}footer>div,nav{display:flex;align-items:center;flex-wrap:wrap;gap:var(--iam-space-3);}a{color:inherit;text-decoration:none;}a:hover{color:var(--iam-accent);text-decoration:underline;}@media(max-width:767px){footer{flex-wrap:wrap;padding:var(--iam-space-3) var(--iam-space-4);}}`,changeDetection:ChangeDetectionStrategy.OnPush})
export class SmartAppFooter {
 private readonly host=inject<ElementRef<HTMLElement>>(ElementRef);
 private readonly document=inject(DOCUMENT);
 constructor(){
  const destroy=inject(DestroyRef);
  afterNextRender(()=>{
   const root=this.document.documentElement;const previous=root.style.getPropertyValue('--iam-app-footer-offset');
   const footer=this.host.nativeElement;let visible=true;
   const update=()=>root.style.setProperty('--iam-app-footer-offset',`${visible ? Math.ceil(footer.getBoundingClientRect().height) : 0}px`);
   const resize=new ResizeObserver(update);resize.observe(footer);
   const intersection=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting ?? false;update();});intersection.observe(footer);update();
   destroy.onDestroy(()=>{resize.disconnect();intersection.disconnect();if(previous)root.style.setProperty('--iam-app-footer-offset',previous);else root.style.removeProperty('--iam-app-footer-offset');});
  });
 }
 readonly metadata=inject(APP_METADATA); readonly year=new Date().getFullYear();
 safeHref(href:string|null):string|null { return href && ((href.startsWith('/') && !href.startsWith('//') && !href.includes('\\')) || /^https:\/\//i.test(href)) ? href : null; }
}
export { APP_METADATA } from '../../core/app-metadata';
export type { AppMetadata, AppFooterLink } from '../../core/app-metadata';
