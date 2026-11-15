import { ChangeDetectionStrategy, Component, DestroyRef, ViewChild, computed, effect, inject, signal, untracked } from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toObservable, toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, firstValueFrom, map, of, startWith, switchMap } from 'rxjs';
import { AuthFacade } from '../../core/auth/auth.facade';
import { ConfirmationService } from '../../core/feedback/dialog.service';
import { ToastService } from '../../core/feedback/toast.service';
import { AdminPageTemplate, PageTemplateKind } from '../../shared/templates/admin-page';
import { Button } from '../../shared/button';
import { IconName } from '../../shared/icon';
import { SmartTextbox, SmartTextarea, SmartDropdown, SmartTabs, SmartBadge } from '../../shared/ui';
import { SmartWizard, WizardConfiguration, UnsavedAware } from '../../shared/ui/wizard';
import { AdminRecord, RECORDS_PROVIDER, Resource, RecordStatus } from './records.models';
import { initialGridRequest } from '../../shared/grid/grid.models';

type PageState={status:'ready'|'loading'|'error'|'empty';record?:AdminRecord};
@Component({selector:'iam-record-page',imports:[DatePipe,NgTemplateOutlet,RouterLink,ReactiveFormsModule,AdminPageTemplate,Button,SmartTextbox,SmartTextarea,SmartDropdown,SmartTabs,SmartBadge,SmartWizard],templateUrl:'./record-page.html',styleUrl:'./record-page.css',changeDetection:ChangeDetectionStrategy.OnPush})
export class RecordPage implements UnsavedAware {
 readonly provider=inject(RECORDS_PROVIDER);
 private readonly route=inject(ActivatedRoute);
 private readonly router=inject(Router);
 private readonly auth=inject(AuthFacade);
 private readonly confirmations=inject(ConfirmationService);
 private readonly toast=inject(ToastService);
 private readonly destroyRef=inject(DestroyRef);
 private readonly metadata=this.route.snapshot.data;
 readonly resource=this.metadata['resource'] as Resource;
 readonly kind=this.metadata['template'] as PageTemplateKind;
 readonly base=this.metadata['base'] as string;
 readonly title=this.metadata['label'] as string;
 readonly icon=this.metadata['icon'] as IconName;
 readonly description='Inspect and manage this '+this.metadata['singular']+'. '+(this.provider.mock?'Mock workflow; no connected IAM operation.':'Changes require server authorization.');
 private readonly params=toSignal(this.route.paramMap,{requireSync:true});
 readonly id=computed(()=>this.params().get('id')??(this.metadata['recordId'] as string|undefined)??null);
 private readonly revision=signal(0);
 private readonly request=computed(()=>({id:this.id(),revision:this.revision()}));
 readonly state=toSignal(toObservable(this.request).pipe(switchMap(request=>request.id?this.provider.get(this.resource,request.id).pipe(map(record=>({status:'ready',record}) as PageState),startWith<PageState>({status:'loading'}),catchError(()=>of<PageState>({status:'error'}))):of<PageState>({status:'ready'}))),{initialValue:{status:'loading'} as PageState});
 readonly preview=signal<PageState['status']>('ready');
 readonly visibleState=computed(()=>this.preview()==='ready'?this.state().status:this.preview());
 readonly busy=signal(false);
 readonly error=signal('');
 readonly tab=signal('details');
 readonly step=signal(0);
 readonly saved=signal(false);
 private readonly confirmed=signal<AdminRecord|null>(null);
 readonly master=toSignal(this.kind==='master-detail'?this.provider.search(this.resource,{...initialGridRequest,pageSize:10}).pipe(map(page=>({status:'ready' as const,items:page.items})),startWith({status:'loading' as const,items:[] as readonly AdminRecord[]}),catchError(()=>of({status:'error' as const,items:[] as readonly AdminRecord[]}))):of({status:'ready' as const,items:[] as readonly AdminRecord[]}),{initialValue:{status:'loading' as 'ready'|'loading'|'error',items:[] as readonly AdminRecord[]}});
 readonly form=new FormGroup({name:new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.minLength(3),Validators.maxLength(120)]}),owner:new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.maxLength(120)]}),category:new FormControl('Technology',{nonNullable:true,validators:Validators.required}),description:new FormControl('',{nonNullable:true,validators:Validators.maxLength(2000)}),status:new FormControl<RecordStatus>('Active',{nonNullable:true})});
 readonly categories=[{value:'Technology',label:'Technology'},{value:'Operations',label:'Operations'}];
 readonly statusOptions=[{value:'Active',label:'Active'},{value:'Inactive',label:'Inactive'}];
 readonly editable=['create','edit','configuration','wizard'].includes(this.kind);
 readonly mayWrite=computed(()=>this.resource==='requests'?this.auth.canAll(['dashboard.view']):this.auth.canAll(['admin.configure']));
 readonly mayDecide=computed(()=>this.auth.canAll(['admin.view']));
 readonly tabs=[{id:'details',label:'Details'},{id:'related',label:'Related records'},{id:'history',label:'History'}];
 @ViewChild(SmartWizard) wizard?:SmartWizard;
 readonly wizardConfig:WizardConfiguration={steps:[{id:'request',title:'Request details',description:'Choose the requested access and owner.',validate:()=>{this.form.markAllAsTouched();return this.form.valid||'Correct the highlighted request fields.';}},{id:'review',title:'Review request',description:'Confirm the mock request before submission.'},{id:'complete',title:'Request submitted',description:'The provider confirmed the submission.'}],dirty:()=>this.form.dirty,saveDraft:async()=>{this.draft.set(this.form.getRawValue());this.form.markAsPristine();},submit:async({signal})=>{await this.persist(signal);this.saved.set(true);}};
 readonly draft=signal<ReturnType<typeof this.form.getRawValue>|null>(null);
 constructor(){effect(()=>{const row=this.state().record;untracked(()=>{if(row){this.confirmed.set(row);this.form.reset({name:row.name,owner:row.owner,category:row.category,description:row.description,status:row.status});}else if(!this.id()){this.form.reset({name:'',owner:'',category:'Technology',description:'',status:this.resource==='requests'?'Pending':'Active'});} });});}
 refresh():void{this.preview.set('ready');this.revision.update(value=>value+1);}
 async persist(signal?:AbortSignal):Promise<AdminRecord>{if(!this.mayWrite())throw new Error('Not authorized');const row=await firstValueFrom(this.provider.save(this.resource,this.id(),this.form.getRawValue()).pipe(takeUntilDestroyed(this.destroyRef)));if(signal?.aborted)throw new Error('Operation cancelled');this.confirmed.set(row);this.form.markAsPristine();return row;}
 async save():Promise<void>{this.form.markAllAsTouched();if(this.form.invalid||this.busy()||!this.mayWrite())return;this.busy.set(true);this.error.set('');this.form.disable();try{const row=await this.persist();this.saved.set(true);this.toast.show({title:this.provider.mock?'Mock changes saved in memory':'Changes saved',tone:'success'});if(this.kind==='create')await this.router.navigate([this.base,row.id]);}catch{this.error.set('Changes could not be saved. Try again.');}finally{this.busy.set(false);this.form.enable();}}
 async cancel():Promise<void>{if(await this.requestLeave()){if(this.kind==='configuration'){const row=this.confirmed()??this.state().record;if(row)this.form.reset(row);return;}this.form.markAsPristine();void this.router.navigate([this.base]);}}
 async requestLeave():Promise<boolean>{if(!this.auth.isAuthenticated()||!this.form.dirty)return true;if(this.kind==='wizard'&&this.wizard)return this.wizard.requestLeave();return (await this.confirmations.confirm({kind:'unsaved',title:'Discard unsaved changes?',message:'Your unsaved form changes will be lost.',primaryLabel:'Discard changes'})).confirmed;}
 async decide(decision:'Approved'|'Rejected'):Promise<void>{
  const id=this.id();
  if(!id||this.busy()||!this.auth.canAll(['admin.view'])||this.state().record?.status!=='Pending')return;
  this.busy.set(true);
  try {
   const result=await this.confirmations.confirm({title:decision==='Approved'?'Approve task?':'Reject task?',message:this.provider.mock?'This records a mock decision only.':'The server will validate this decision.',reason:'required',primaryLabel:decision==='Approved'?'Approve':'Reject',execute:async({reason})=>{await firstValueFrom(this.provider.decide(id,decision,reason).pipe(takeUntilDestroyed(this.destroyRef)));}});
   if(result.confirmed){this.toast.show({title:'Decision recorded',tone:'success'});this.refresh();}
  } finally {this.busy.set(false);}
 }
}
