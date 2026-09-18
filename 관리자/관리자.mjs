const $=id=>document.getElementById(id);
const labels={unshot:'미촬영',uploaded:'사진 업로드됨',pending:'구현 대기 · 승인 대기',approved:'구현 대기 · 승인됨',in_progress:'구현 중',completed:'구현 완료'};
let auth={},structure={rooms:[],buildings:[]},building='MAIN',floor=1,roomId=null,tab='upload',selection=[],busy=false;
const notice=(text,error=false)=>{$('알림').textContent=text;$('알림').classList.toggle('error',error);};
function el(tag,text,className){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;}
function button(text,fn){const b=el('button',text);b.type='button';b.addEventListener('click',()=>Promise.resolve().then(fn).catch(e=>notice(e.message,true)));return b;}
async function api(route,body){
  const response=await fetch('/api/admin/'+route,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json','X-CSRF-Token':auth.csrf??''}:{},...(body?{body:JSON.stringify(body)}:{})});
  const result=await response.json();if(!response.ok){if(response.status===401&&route!=='login'){auth={};showAuth();}throw new Error(result.error??'요청에 실패했습니다.');}return result;
}
function showAuth(){$('로그인구역').hidden=!!auth.authenticated;$('관리구역').hidden=!auth.authenticated;$('계정').hidden=!auth.authenticated;}
async function load(){structure=await api('structure');render();}
function clearSelection(){for(const item of selection)if(item.preview)URL.revokeObjectURL(item.preview);selection=[];renderSelection();}
function chooseRoom(r){if(busy)return;clearSelection();roomId=r.roomId;building=r.building;floor=parseInt(r.floor);$('개인정보확인').checked=false;render();$('선택공간').scrollIntoView({behavior:'smooth',block:'start'});}
function render(){
  showAuth();const r=structure.rooms.find(r=>r.roomId===roomId),bn=building==='MAIN'?'본관':'별관';
  $('경로').textContent=`관리자 > ${bn} > ${floor}층${r?' > '+r.roomName:''}`;
  $('건물선택').replaceChildren(...structure.buildings.map(b=>{const node=button(b.name,()=>{if(busy)return;building=b.id;floor=1;roomId=null;clearSelection();render();});node.setAttribute('aria-pressed',String(building===b.id));return node;}));
  $('층선택').replaceChildren(...(structure.buildings.find(b=>b.id===building)?.floors??[]).map(f=>{const node=button(f+'층',()=>{if(busy)return;floor=f;roomId=null;clearSelection();render();});node.setAttribute('aria-pressed',String(floor===f));return node;}));
  const list=structure.rooms.filter(r=>tab==='upload'?r.building===building&&parseInt(r.floor)===floor:tab==='pending'?['pending','approved','in_progress'].includes(r.status):r.status==='completed'||r.existingImplementation&&r.status==='unshot');
  $('목록제목').textContent=tab==='upload'?`${bn} ${floor}층`:tab==='pending'?'구현 대기 · 진행 중':'구현 완료';
  $('공간목록').replaceChildren(...list.map(r=>{const b=button(r.roomName,()=>chooseRoom(r));b.append(el('span',r.existingImplementation&&r.status==='unshot'?'기존 모델 구현됨 · 새 사진 없음':labels[r.status],'badge '+r.status));if(tab!=='upload')b.append(el('small',`${r.building==='MAIN'?'본관':'별관'} ${parseInt(r.floor)}층`));return b;}));
  if(!list.length)$('공간목록').append(el('p','해당하는 공간이 없습니다.'));
  $('선택공간').hidden=!r;if(!r)return;
  $('공간제목').textContent=r.roomName;$('공간상태').textContent=`${labels[r.status]} · 사진 ${r.images?.length??0}장${r.uploadedAt?' · 최근 업로드 '+new Date(r.uploadedAt).toLocaleString('ko-KR'):''}`;
  $('용량안내').textContent=`파일당 최대 ${(auth.maxUploadBytes??20*1024*1024)/1024/1024}MB / 한 번에 최대 30장 · 서버에서 순서대로 저장`;
  $('저장사진').replaceChildren(...(r.images??[]).map(i=>{const card=el('div',undefined,'photo'),a=el('a');a.href=i.previewUrl;a.target='_blank';a.rel='noopener';const img=el('img');img.src=i.previewUrl;img.loading='lazy';img.alt=i.originalName;a.append(img);card.append(a,el('p',i.originalName),el('p',`${i.type==='panorama-candidate'?'360 후보':'일반 사진'} · ${i.approval==='approved'?'승인됨':'승인 대기'}`));return card;}));
  $('이름수정').disabled=!auth.authenticated;$('실삭제').disabled=!auth.authenticated||!r.custom||!!r.images?.length;
  $('승인').disabled=!auth.authenticated||!(r.images??[]).some(i=>i.approval==='pending');
  for(const id of ['구현중','구현완료'])$(id).disabled=!auth.authenticated||!r.approvedAt||r.status==='pending';
}
function renderSelection(){
  $('선택사진').replaceChildren(...selection.map(item=>{
    const card=el('div',undefined,'photo');if(item.preview){const img=el('img');img.src=item.preview;img.alt=item.file.name;card.append(img);}
    card.append(el('p',item.file.name),el('p',(item.file.size/1024/1024).toFixed(2)+' MB'));
    const progress=el('progress');progress.max=100;progress.value=item.progress??0;card.append(progress,el('p',item.message??'업로드 전'));
    const remove=button('선택 해제',()=>{if(busy)return;URL.revokeObjectURL(item.preview);selection=selection.filter(x=>x!==item);renderSelection();});remove.disabled=busy;card.append(remove);return card;
  }));
  $('업로드').disabled=busy||!selection.some(i=>!i.invalid&&!i.done);$('업로드').textContent=busy?'순서대로 저장 중…':`${selection.filter(i=>!i.invalid&&!i.done).length}장 업로드`;
}
async function addFiles(files){
  if(busy)return;notice('');for(const file of files){
    if(selection.length>=30){notice('한 번에 최대 30장을 선택할 수 있습니다.',true);break;}
    const item={file};selection.push(item);
    if(!/\.(jpe?g|png|webp)$/i.test(file.name)||!['image/jpeg','image/png','image/webp'].includes(file.type)){item.invalid=true;item.message='지원하지 않는 파일 형식';}
    else if(file.size>(auth.maxUploadBytes??20*1024*1024)){item.invalid=true;item.message='최대 파일 크기 초과';}
    else try{
      // Decode one preview at a time and immediately release the original bitmap.
      const bitmap=await createImageBitmap(file,{resizeWidth:360,resizeQuality:'low'}),canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;canvas.getContext('2d').drawImage(bitmap,0,0);bitmap.close();
      const thumb=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.75));if(thumb)item.preview=URL.createObjectURL(thumb);
    }catch{item.message='미리보기 불가 · 서버에서 파일을 확인합니다.';}
  }renderSelection();
}
function uploadOne(item,target){return new Promise((resolve,reject)=>{
  const xhr=new XMLHttpRequest();xhr.open('POST','/api/admin/upload?roomId='+encodeURIComponent(target));xhr.timeout=180000;
  xhr.setRequestHeader('Content-Type',item.file.type);xhr.setRequestHeader('X-File-Name',encodeURIComponent(item.file.name));xhr.setRequestHeader('X-CSRF-Token',auth.csrf);
  xhr.upload.onprogress=e=>{item.progress=e.lengthComputable?Math.round(e.loaded/e.total*100):0;item.message=item.progress===100?'서버에서 GitHub에 저장 중…':`전송 ${item.progress}%`;renderSelection();};
  xhr.onload=()=>{let result;try{result=JSON.parse(xhr.responseText);}catch{return reject(new Error('서버 응답을 확인해주세요.'));}xhr.status>=200&&xhr.status<300?resolve(result):reject(new Error(result.error??'저장 실패'));};
  xhr.onerror=()=>reject(new Error('네트워크 오류 · 목록을 새로고침해 저장 여부를 먼저 확인하세요.'));xhr.ontimeout=()=>reject(new Error('시간 초과 · 목록에서 저장 여부를 확인 후 재시도하세요.'));xhr.send(item.file);
});}
$('로그인').addEventListener('submit',async e=>{e.preventDefault();const password=$('관리자암호').value;$('관리자암호').value='';try{await api('login',{password});auth=await api('session');showAuth();notice('로그인되었습니다.');await load();}catch(e){notice(e.message,true);}});
$('로그아웃').onclick=async()=>{if(busy)return;try{await api('logout',{});auth={};roomId=null;clearSelection();showAuth();notice('로그아웃되었습니다.');}catch(e){notice(e.message,true);}};
for(const node of document.querySelectorAll('[data-tab]'))node.onclick=()=>{if(busy)return;tab=node.dataset.tab;for(const b of document.querySelectorAll('[data-tab]'))b.setAttribute('aria-pressed',String(b===node));roomId=null;clearSelection();render();};
$('사진선택').onclick=e=>{e.stopPropagation();$('파일선택').click();};$('드롭영역').onclick=()=>$('파일선택').click();$('드롭영역').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('파일선택').click();}};
$('파일선택').onchange=async e=>{await addFiles(e.target.files);e.target.value='';};
for(const event of ['dragenter','dragover'])$('드롭영역').addEventListener(event,e=>{e.preventDefault();$('드롭영역').classList.add('hover');});
$('드롭영역').ondragleave=()=>$('드롭영역').classList.remove('hover');$('드롭영역').ondrop=e=>{e.preventDefault();$('드롭영역').classList.remove('hover');addFiles(e.dataTransfer.files);};
$('업로드').onclick=async()=>{
  if(busy||!roomId)return;busy=true;const target=roomId;let success=0,failed=0;renderSelection();
  try{for(const item of selection.filter(i=>!i.invalid&&!i.done)){try{await uploadOne(item,target);item.done=true;item.message='저장 완료 · 승인 대기';success++;}catch(e){item.message=e.message;failed++;}renderSelection();}
    $('업로드결과').textContent=`사진 ${success}장이 업로드되었습니다. 3D 구현 승인 대기 상태입니다.${failed?' 실패 '+failed+'장: 각 파일의 메시지를 확인해주세요.':''}`;
    await load();
  }catch(e){notice(e.message,true);}finally{busy=false;renderSelection();}
};
$('실추가').onclick=async()=>{const name=prompt('추가할 공간의 한글 이름 (3D 구조는 변경하지 않습니다)');if(!name)return;try{const result=await api('rooms',{action:'add',name,building,floor});await load();chooseRoom(result.room);}catch(e){notice(e.message,true);}};
$('이름수정').onclick=async()=>{const r=structure.rooms.find(r=>r.roomId===roomId),name=prompt('사진 관리용 이름 (기존 3D 명칭은 유지)',r.roomName);if(!name)return;try{await api('rooms',{action:'rename',roomId,name,revision:r.revision});await load();}catch(e){notice(e.message,true);}};
$('실삭제').onclick=async()=>{if(!confirm('사진이 없는 추가 공간을 목록에서 숨길까요? 기존 3D 구조는 유지됩니다.'))return;const r=structure.rooms.find(r=>r.roomId===roomId);try{await api('rooms',{action:'archive',roomId,revision:r.revision});roomId=null;await load();}catch(e){notice(e.message,true);}};
$('승인').onclick=async()=>{const r=structure.rooms.find(r=>r.roomId===roomId);try{await api('approve',{roomId,revision:r.revision,privacyConfirmed:$('개인정보확인').checked});await load();notice('사진이 승인되었습니다. 3D 모델은 자동 변경되지 않습니다.');}catch(e){notice(e.message,true);}};
for(const [id,status] of [['구현중','in_progress'],['구현완료','completed']])$(id).onclick=async()=>{const r=structure.rooms.find(r=>r.roomId===roomId);try{await api('status',{roomId,status,revision:r.revision});await load();notice('진행 현황을 변경했습니다.');}catch(e){notice(e.message,true);}};
window.addEventListener('beforeunload',e=>{if(busy){e.preventDefault();e.returnValue='';}});
try{auth=await api('session');showAuth();if(auth.authenticated)await load();else if(!auth.configured)notice('Railway 관리자 환경변수 설정 후 사용할 수 있습니다.');}catch(e){notice(e.message,true);}
