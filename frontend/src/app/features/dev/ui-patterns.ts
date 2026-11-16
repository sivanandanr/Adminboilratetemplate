import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, viewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AUTH_CONFIG } from '../../core/auth/auth.config';
import { AuthDialogPreview } from '../../core/auth/auth-dialogs';
import { ConnectionService } from '../../core/feedback/connection.service';
import { GridPaginationComponent } from '../../shared/grid/grid-controls';
import { SmartPageHeader, SmartCard, SmartButton, SmartButtonGroup, SmartActionToolbar, SmartForm, SmartFormSection, SmartTextbox, SmartTextarea, SmartNumberInput, SmartPassword, SmartDropdown, SmartMultiSelect, SmartAutocomplete, SmartCheckbox, SmartToggle, SmartDatePicker, SmartDateRangePicker, SmartRadioGroup, SmartFileUpload, SmartStatusBadge, SmartTabs, SmartAccordion, SmartAccordionGroup, SmartBreadcrumb, SmartDrawer, SmartTable, SmartModal, SmartProgressBar, SmartSpinner, SmartSkeleton, SmartLoadingOverlay, BlockUiService, DialogService, ToastService, TaskService, FileUploadState, FeedbackTone, requestFeedback } from '../../shared/ui';
import { AdvancedGridPattern } from './advanced-grid-pattern';
import { PatternDraft, UiPatternsDemoProvider } from './ui-patterns-demo.provider';

@Component({selector:'iam-ui-patterns',imports:[AdvancedGridPattern,ReactiveFormsModule,GridPaginationComponent,SmartPageHeader,SmartCard,SmartButton,SmartButtonGroup,SmartActionToolbar,SmartForm,SmartFormSection,SmartTextbox,SmartTextarea,SmartNumberInput,SmartPassword,SmartDropdown,SmartMultiSelect,SmartAutocomplete,SmartCheckbox,SmartToggle,SmartDatePicker,SmartDateRangePicker,SmartRadioGroup,SmartFileUpload,SmartStatusBadge,SmartTabs,SmartAccordion,SmartAccordionGroup,SmartBreadcrumb,SmartDrawer,SmartTable,SmartModal,SmartProgressBar,SmartSpinner,SmartSkeleton,SmartLoadingOverlay],templateUrl:'./ui-patterns.html',styleUrl:'./ui-patterns.css',changeDetection:ChangeDetectionStrategy.OnPush})
export class UiPatterns {
 readonly sections=[{id:'feedback',label:'Actions and feedback'},{id:'progress',label:'Progress and tasks'},{id:'forms',label:'Forms and unsaved changes'},{id:'data',label:'Tables and selection'},{id:'advanced-grid',label:'Advanced data grid'},{id:'containers',label:'Containers and status'}];
 readonly section=signal('feedback');readonly result=signal('');readonly running=signal(false);readonly modal=signal(false);readonly drawer=signal(false);readonly overlay=signal(false);readonly tablePage=signal(1);readonly tableSize=signal(5);readonly uploads=signal<readonly FileUploadState[]>([]);
 readonly tones:readonly FeedbackTone[]=['success','info','warning','error'];
 readonly options=[{value:'admin',label:'Administrator'},{value:'reader',label:'Reader'},{value:'owner',label:'Application owner'},{value:'locked',label:'Unavailable role',disabled:true}];
 readonly form=new FormGroup({name:new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.minLength(3)]}),description:new FormControl('',{nonNullable:true}),count:new FormControl<number|null>(1,Validators.min(1)),accepted:new FormControl(false,{nonNullable:true,validators:Validators.requiredTrue}),role:new FormControl<string|null>(null,Validators.required),owners:new FormControl<readonly string[]|null>([]),start:new FormControl<string|null>(null),end:new FormControl<string|null>(null)});
 readonly immediate=new FormControl(false);readonly savedNote=signal('');
 readonly applyImmediate=async(next:boolean):Promise<boolean>=>{try{await firstValueFrom(this.http.post('/api/ui-patterns-demo/unknown',{enabled:next}));this.toasts.success('Demo setting applied');return true;}catch{return false;}};
 readonly searchOwners=new FormControl<readonly string[]|null>([]);
 readonly people=Array.from({length:12},(_,index)=>({value:`demo-person-${index+1}`,label:['Alex Morgan','Amelia Chen','Avery Patel','Daniel Lee','Emma Wilson','Ethan Tan','Grace Lim','Jamie Taylor','Jordan Smith','Mia Wong','Noah Thomas','Olivia Brown'][index]}));
 readonly password=new FormControl('');readonly radio=new FormControl('reader');readonly owner=new FormControl<string|readonly string[]|null>(null);readonly range=new FormControl<{start:string;end:string}|null>(null);readonly files=new FormControl<readonly File[]>([]);readonly drawerForm=new FormGroup({note:new FormControl('',{nonNullable:true})});
 readonly mainFormView=viewChild<SmartForm>('mainState');readonly drawerFormView=viewChild<SmartForm>('drawerState');
 private readonly http=inject(HttpClient);readonly blockUi=inject(BlockUiService);readonly dialogs=inject(DialogService);readonly toasts=inject(ToastService);readonly tasks=inject(TaskService);readonly work=inject(UiPatternsDemoProvider);readonly connection=inject(ConnectionService);readonly authPreview=inject(AuthDialogPreview);readonly config=inject(AUTH_CONFIG);
 constructor(){inject(DestroyRef).onDestroy(()=>{for(const file of this.files.value??[])this.work.cancelFile(file);this.authPreview.mode.set(null);});}
 selectSection(id:string):void{if(this.section()==='forms'&&id!=='forms')this.form.reset(this.work.saved()??this.initialDraft());this.section.set(id);this.result.set('');}
 private initialDraft():PatternDraft{return{name:'',description:'',count:1,accepted:false,role:null,owners:[],start:null,end:null};}
 closeForm():void{this.form.reset(this.work.saved()??this.initialDraft());this.result.set('Demo draft closed.');}
 async saveForm():Promise<void>{const state=this.mainFormView();if(!state?.validate()||this.running())return;this.running.set(true);try{await state.save(()=>this.blockUi.run('Saving your changes',()=>this.work.save(this.form.getRawValue())));this.toasts.success('Demo draft saved','Stored in memory only.');this.result.set('Demo draft saved in memory.');}finally{this.running.set(false);}}
 toast(tone:FeedbackTone):void{this.toasts.show({tone,title:`${tone[0].toUpperCase()+tone.slice(1)} example`,message:'Shared feedback with the configured timing, close and pause behavior.'});}
 async confirm(reason=false):Promise<void>{const options={kind:'delete' as const,title:reason?'Delete this demo item?':'Confirm this demo action?',message:'This affects demonstration state only.',primaryLabel:reason?'Delete':'Confirm',secondaryLabel:'Keep item'};const result=reason?await this.dialogs.confirmWithReason(options):await this.dialogs.confirm({...options,kind:'confirm'});this.result.set(result.confirmed?(reason?'Demo deletion confirmed with a reason.':'Demo action confirmed.'):'Demo action cancelled.');}
 async info():Promise<void>{await this.dialogs.info({title:'Shared information dialog',message:'Focus is contained and returns to its trigger when the dialog closes.'});}
 async request(kind:'read'|'quick'|'unknown'|'slow'|'failure'):Promise<void>{if(this.running())return;this.running.set(true);try{const context=requestFeedback({title:kind==='slow'?'Waiting for the demo service':'Saving your changes',message:'Development fixture response; no business record is changed.'});await firstValueFrom(kind==='read'?this.http.get('/api/ui-patterns-demo/read',{context}):this.http.post('/api/ui-patterns-demo/'+kind,{}, {context}));this.result.set('Demo response confirmed.');}catch{this.result.set('Demo response failed; existing values are unchanged.');}finally{this.running.set(false);}}
 async stepped():Promise<void>{if(this.running())return;this.running.set(true);try{await this.blockUi.run('Saving your changes',handle=>this.work.save({...this.initialDraft(),name:'Example draft'},handle),{steps:['Check the draft','Store the local revision','Confirm the result']});this.toasts.success('Stepped demo completed');}finally{this.running.set(false);}}
 startTask(kind:'export'|'import'|'retry'):void{this.work.startTask(this.tasks,kind);}
 async checkFile():Promise<void>{const file=this.files.value?.[0];if(!file)return;await this.work.checkFile(file,state=>this.uploads.set([state]));}
 saveNote():void{this.savedNote.set(this.drawerForm.getRawValue().note);this.drawerForm.reset({note:this.savedNote()});this.drawer.set(false);this.toasts.success('Demo note saved','Memory only.');}
 closeDrawer():void{this.drawerForm.reset({note:this.savedNote()});this.drawer.set(false);}
 get rows():readonly {id:number;name:string}[]{const start=(this.tablePage()-1)*this.tableSize();return Array.from({length:Math.min(this.tableSize(),25-start)},(_,index)=>({id:start+index+1,name:`Example member ${start+index+1}`}));}
 resizeTable(size:number):void{this.tableSize.set(size);this.tablePage.set(1);}
 restartIdleDemo():void{window.location.assign('/ui-patterns?idleDemo=1');}
 restoreIdleTiming():void{window.location.assign('/ui-patterns');}
}
