import { useEffect,useRef,useState } from 'react';
import type { AppStatusValue } from './appStatusStore';
const RESULT_MS=1000;
export type DisplayStatus=AppStatusValue&{readonly key:number;readonly phase:'enter'|'visible'|'exit'};
export function useAppStatusLifecycle(source:AppStatusValue|null):DisplayStatus|null{const [display,setDisplay]=useState<DisplayStatus|null>(source===null?null:{...source,key:1,phase:'enter'});const key=useRef(1);useEffect(()=>{if(source===null){setDisplay(null);return;}key.current+=1;const next={...source,key:key.current,phase:'enter' as const};setDisplay(next);if(source.kind==='success'||source.kind==='error'){const timer=setTimeout(()=>setDisplay({...next,phase:'exit'}),RESULT_MS);return()=>clearTimeout(timer);}return undefined;},[source]);return display;}
