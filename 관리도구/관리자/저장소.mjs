// Server-only GitHub adapter. A photo + manifest + catalog publish atomically.
export class ApiError extends Error {constructor(status,message){super(message);this.status=status;}}
export const CATALOG='school-assets/catalog.json';
export class GithubStore {
  constructor(env,fetcher=fetch){this.env=env;this.fetcher=fetcher;this.tail=Promise.resolve();}
  ready(){return ['GITHUB_TOKEN','GITHUB_OWNER','GITHUB_REPO','GITHUB_BRANCH'].every(k=>this.env[k]);}
  async api(route,method='GET',body,raw=false){
    if(!this.ready())throw new ApiError(503,'GitHub 저장소 환경변수를 설정해주세요.');
    const {GITHUB_OWNER:o,GITHUB_REPO:r,GITHUB_TOKEN:token}=this.env;
    if(!/^[\w.-]+$/.test(o)||!/^[\w.-]+$/.test(r))throw new ApiError(503,'GitHub 저장소 설정이 올바르지 않습니다.');
    let response;
    try{response=await this.fetcher(`https://api.github.com/repos/${o}/${r}${route}`,{method,
      headers:{Authorization:`Bearer ${token}`,Accept:raw?'application/vnd.github.raw+json':'application/vnd.github+json','X-GitHub-Api-Version':'2026-03-10',...(body?{'Content-Type':'application/json'}:{})},
      ...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(45000),redirect:'error'});
    }catch{throw new ApiError(502,'GitHub 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');}
    if(!response.ok){await response.body?.cancel();throw new ApiError([401,403].includes(response.status)?503:response.status,[409,422].includes(response.status)?'저장소가 변경되었습니다. 새로고침 후 다시 시도해주세요.':'GitHub 저장소 권한·브랜치·사용량 제한을 확인해주세요.');}
    return raw?response:response.json();
  }
  async checkPrivate(){
    const info=await this.api('');
    if(!info.private)throw new ApiError(503,'승인 전 원본 사진 보호를 위해 비공개 사진 저장소를 지정해주세요.');
  }
  async snapshot(){
    await this.checkPrivate();
    const ref=await this.api('/git/ref/heads/'+encodeURIComponent(this.env.GITHUB_BRANCH));
    const head=ref.object.sha,commit=await this.api('/git/commits/'+head);
    let catalog={version:1,rooms:{}};
    try{
      const file=await this.api('/contents/'+CATALOG+'?ref='+head);
      if(file.size>2*1024*1024||!file.content)throw new ApiError(503,'사진 목록이 너무 큽니다. 관리자 확인이 필요합니다.');
      catalog=JSON.parse(Buffer.from(file.content,'base64').toString('utf8'));
      if(catalog.version!==1||!catalog.rooms||typeof catalog.rooms!=='object')throw new ApiError(503,'사진 목록 형식을 확인해주세요.');
    }catch(e){if(e.status!==404)throw e;}
    return {head,tree:commit.tree.sha,catalog};
  }
  mutate(change){
    const run=async()=>{
      for(let attempt=0;attempt<3;attempt++){
        const snapshot=await this.snapshot(),result=await change(snapshot.catalog),tree=[];
        if(Buffer.byteLength(JSON.stringify(snapshot.catalog))>900000)throw new ApiError(409,'사진 목록 용량 한도에 도달했습니다. 저장소 분리를 관리자에게 요청해주세요.');
        for(const file of [...(result.files??[]),{path:CATALOG,content:JSON.stringify(snapshot.catalog)}]){
          // Only the fixed intake prefix can be written, never application code.
          if(!file.path.startsWith('school-assets/')||file.path.includes('..')||file.path.includes('\\'))throw new ApiError(400,'잘못된 저장 경로입니다.');
          const blob=await this.api('/git/blobs','POST',{content:Buffer.isBuffer(file.content)?file.content.toString('base64'):file.content,encoding:Buffer.isBuffer(file.content)?'base64':'utf-8'});
          tree.push({path:file.path,mode:'100644',type:'blob',sha:blob.sha});
        }
        const nextTree=await this.api('/git/trees','POST',{base_tree:snapshot.tree,tree});
        const commit=await this.api('/git/commits','POST',{message:result.message??'학교 사진 관리',tree:nextTree.sha,parents:[snapshot.head]});
        try{await this.api('/git/refs/heads/'+encodeURIComponent(this.env.GITHUB_BRANCH),'PATCH',{sha:commit.sha,force:false});return {...result.value,commit:commit.sha};}
        catch(e){if(![409,422].includes(e.status)||attempt===2)throw e;}
      }
    };
    const job=this.tail.then(run);this.tail=job.catch(()=>{});return job;
  }
  async image(path,head){return this.api('/contents/'+path.split('/').map(encodeURIComponent).join('/')+'?ref='+head,'GET',undefined,true);}
}
