import { Injectable, signal } from '@angular/core';
import { BlockUiHandle, FileUploadState, TaskHandle, TaskService } from '../../shared/ui';
import { abortableDemoDelay } from './demo-utils';
export interface PatternDraft { name:string; description:string; count:number|null; accepted:boolean; role:string|null; owners:readonly string[]|null; start:string|null; end:string|null; }
/** Bounded, explicitly local showcase work. Never a production server-job or upload adapter. */
@Injectable({providedIn:'root'})
export class UiPatternsDemoProvider {
 readonly marker='UI_PATTERN_DEMO_ONLY';
 readonly saved=signal<PatternDraft|null>(null);
 private readonly files=new Map<File,AbortController>();
 async save(draft:PatternDraft,progress?:BlockUiHandle):Promise<void>{
  await abortableDemoDelay(350,new AbortController().signal);if(!draft.name.trim())throw new Error('Enter a name.');progress?.update({completedSteps:1});
  await abortableDemoDelay(350,new AbortController().signal);this.saved.set({...draft,owners:[...(draft.owners??[])]});progress?.update({completedSteps:2});
  await abortableDemoDelay(350,new AbortController().signal);progress?.update({completedSteps:3});
 }
 startTask(tasks:TaskService,kind:'export'|'import'|'retry'):TaskHandle{
  let attempt=0, controller=new AbortController();
  const run=async(handle:TaskHandle)=>{
   controller=new AbortController();attempt++;const rows=['id,name'];
   try{for(let batch=0;batch<20;batch++){
    await abortableDemoDelay(200,controller.signal);
    if(kind==='retry'&&attempt===1&&batch===3){handle.fail('Demo import stopped at a confirmed batch. Choose Retry to run it again.');return;}
    for(let item=0;item<25;item++){const id=batch*25+item+1;rows.push(`${id},Example member ${id}`);}
    handle.progress(rows.length-1,500);
   }
   handle.complete({message:'500 demo rows processed.',...(kind==='export'?{download:async()=>({filename:'ui-patterns-demo.csv',blob:new Blob([rows.join('\r\n')],{type:'text/csv'})})}:{})});
   }catch{if(!controller.signal.aborted)handle.fail('Demo work failed. Retry the task.');}
  };
  return tasks.start({title:kind==='export'?'Export demo members':kind==='import'?'Import demo members':'Retryable demo import',unit:'rows',total:500,run,retry:run,cancel:async()=>{controller.abort();await abortableDemoDelay(100,new AbortController().signal);}});
 }
 async checkFile(file:File,report:(state:FileUploadState)=>void):Promise<void>{
  const controller=new AbortController();this.files.set(file,controller);let loaded=0,text='';const decoder=new TextDecoder();
  try{report({file,status:'uploading',loaded,total:file.size,canCancel:true,message:'Reading local file bytes; nothing is sent to a server.'});
   while(loaded<file.size){const bytes=await file.slice(loaded,loaded+65536).arrayBuffer();if(controller.signal.aborted)throw new Error('Cancelled');text+=decoder.decode(bytes,{stream:true});loaded+=bytes.byteLength;report({file,status:'uploading',loaded,total:file.size,canCancel:true,message:'Reading local file bytes; nothing is sent to a server.'});await abortableDemoDelay(100,controller.signal);}
   text+=decoder.decode();report({file,status:'checking',canCancel:true,message:'Checking basic CSV structure locally.'});await abortableDemoDelay(500,controller.signal);
   const lines=text.trim().split(/\r?\n/);if(!text.trim()||text.includes('\0')||!lines[0].includes(',')||lines.length<2)throw new Error('Choose a CSV with a comma-separated header and at least one data row.');
   report({file,status:'ready',loaded,total:file.size,message:`Basic structure checked: ${lines.length-1} data lines. Server validation is still required for real uploads.`});
  }catch(error){report({file,status:controller.signal.aborted?'cancelled':'failed',message:controller.signal.aborted?'Local file check cancelled.':error instanceof Error?error.message:'Choose another CSV and try again.'});}
  finally{if(this.files.get(file)===controller)this.files.delete(file);}
 }
 cancelFile(file:File):void{this.files.get(file)?.abort();}
}
