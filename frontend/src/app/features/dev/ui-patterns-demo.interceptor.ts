import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map, mergeMap, throwError, timer } from 'rxjs';
/** Development fixture responses only; never installed by the production environment. No fake percentages. */
export const UiPatternsDemoInterceptor:HttpInterceptorFn=(request,next)=>{
 const path=request.url.split('?')[0];if(!path.startsWith('/api/ui-patterns-demo/'))return next(request);
 const operation=path.slice('/api/ui-patterns-demo/'.length);
 if(!['read','quick','unknown','slow','failure'].includes(operation))return next(request);
 const milliseconds=operation==='quick'?120:operation==='slow'?9200:operation==='failure'?600:1400;
 return timer(milliseconds).pipe(mergeMap(()=>operation==='failure'?throwError(()=>new HttpErrorResponse({status:500,statusText:'Demo failure',url:request.url,error:{}})):timer(0).pipe(map(()=>new HttpResponse({status:200,url:request.url,body:{confirmed:true}})))));
};
