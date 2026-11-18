// Render/eligibility tests using isolated public-content fixtures, never deployed content.
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const root=require('node:path').join(__dirname,'..');
function boot(config, storageFailure=false, stored=new Map()){
 const elements=new Map();const el=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',elements:[],formData:[],reset(){this.formData=[];},addEventListener(){},classList:{toggle(){}},replaceChildren(){},showModal(){this.open=true;}});return elements.get(id);};
 const ctx=vm.createContext({window:{},document:{querySelector:el,body:{classList:{toggle(){}}},addEventListener(){}},URL,URLSearchParams,location:{search:'?embed=1'},Intl,Date,Map,console,FormData:class {constructor(form){return form.formData;}},localStorage:{getItem(key){if(storageFailure)throw Error('blocked');return stored.get(key)||null;},setItem(key,value){if(storageFailure)throw Error('blocked');stored.set(key,value);},removeItem(key){if(storageFailure)throw Error('blocked');stored.delete(key);}}});
 vm.runInContext(fs.readFileSync(root+'/content.js','utf8'),ctx);if(config)Object.assign(ctx.window.HUB_CONTENT,config);vm.runInContext(fs.readFileSync(root+'/script.js','utf8'),ctx);return {ctx,elements,run:s=>vm.runInContext(s,ctx)};
}
let t=boot();assert.match(t.elements.get('#casting-projects').innerHTML,/Something fun is in the works/);assert.match(t.elements.get('#project-gallery').innerHTML,/Meet the Squad/);assert.doesNotMatch(t.elements.get('#project-gallery').innerHTML,/class="label">Published/);assert.match(t.elements.get('#resource-links').innerHTML,/aria-disabled="true"/);
const project={id:'fixture',title:'Fixture <script>',description:'Testing only',status:'casting',thumbnail:'javascript:alert(1)',submissionDeadline:'2099-01-01',instructions:'Record a short tip',discussionUrl:'https://example.com/discussion',publishedReelUrl:'',participatingSpecialists:[]};
t=boot({activeCollaborations:[project],completedCollaborations:[],upcomingDeadlines:[{id:'bad',title:'Invalid',date:'2026-99-99'}]});assert.match(t.elements.get('#casting-projects').innerHTML,/Fixture &lt;script&gt;/);assert.match(t.elements.get('#casting-projects').innerHTML,/Record a short tip/);assert.doesNotMatch(t.elements.get('#casting-projects').innerHTML,/src="javascript:/);assert.match(t.elements.get('#deadlines').innerHTML,/2099/);
t=boot({activeCollaborations:[{...project,submissionDeadline:'2000-01-01'}]});assert.equal(t.run('openProjects().length'),0);
t=boot({completedCollaborations:[{...project,status:'published'}]});assert.equal(t.run('publishedProjects().length'),0);
t=boot({completedCollaborations:[{...project,status:'published',publishedReelUrl:'https://example.com/reel'}]});assert.equal(t.run('publishedProjects().length'),1);assert.match(t.elements.get('#project-gallery').innerHTML,/Watch the Reel/);
t=boot({completedCollaborations:[project]});assert.match(t.elements.get('#project-gallery').innerHTML,/Project discussion/);assert.doesNotMatch(t.elements.get('#project-gallery').innerHTML,/Watch the Reel/);
t=boot({completedCollaborations:[{...project,discussionUrl:'javascript:alert(1)'}]});assert.doesNotMatch(t.elements.get('#project-gallery').innerHTML,/href="javascript:/);
t=boot(null,true);assert.equal(JSON.stringify(t.run("loadDraft('pitch')")),'{}');assert.match(t.elements.get('#status').textContent,/storage is unavailable/);
assert.equal(t.run("publicUrl('javascript:alert(1)')"),'');assert.equal(t.run("dateValid('2026-02-30')"),false);
console.log('PASS: empty states, configured casting, escaped content, safe URLs, expired/invalid deadlines, verified publication, storage fallback');

t=boot();assert.equal(t.run("discussionDestination({discussionUrl:'javascript:alert(1)'}).url"),t.run('content.discoUrl'));assert.equal(t.run("discussionDestination({discussionUrl:'https://example.com/project'}).url"),'https://example.com/project');assert.match(t.run('submissionHelp()'),/Open folder instructions in Disco/);
t=boot({submissionInstructionsUrl:'javascript:alert(1)'});assert.equal(t.run('submissionHelp()'),'');

t=boot();t.run("openPanel('submit')");assert.match(t.elements.get('#modal-body').innerHTML,/Have footage to upload/);assert.match(t.elements.get('#modal-body').innerHTML,/Opening Disco does not submit your draft/);assert.match(t.elements.get('#modal-body').innerHTML,/Paste your draft, check it, and send it in Disco/);
t=boot();t.run("openPanel('pitch')");assert.doesNotMatch(t.elements.get('#modal-body').innerHTML,/Have footage to upload/);assert.match(t.elements.get('#modal-body').innerHTML,/handoff-steps/);
console.log('PASS: submission help, review instructions, and safe discussion fallback');

// Exercise input -> persistence -> new page -> clear -> close/flow switch.
const stored=new Map();
t=boot(null,false,stored);t.run("openPanel('pitch')");
t.elements.get('#flow-form').formData=[['title','A useful idea'],['idea','Draft details']];
t.elements.get('#flow-form').oninput();
assert.equal(JSON.parse(stored.get('totsquad-pitch-v2')).title,'A useful idea');
assert.match(t.elements.get('#status').textContent,/saved on this device/);
t=boot(null,false,stored);assert.equal(t.run("loadDraft('pitch').title"),'A useful idea');
t.run("openPanel('pitch')");t.elements.get('#clear-draft').onclick();t.run('stash()');
assert.equal(stored.has('totsquad-pitch-v2'),false);
assert.equal(JSON.stringify(t.run("loadDraft('pitch')")),'{}');
t.run("openPanel('submit')");assert.equal(stored.has('totsquad-pitch-v2'),false);
t.elements.get('#flow-form').formData=[['title','My submission']];t.elements.get('#flow-form').oninput();
assert.equal(JSON.parse(stored.get('totsquad-submit-v2')).title,'My submission');
assert.equal(stored.has('totsquad-pitch-v2'),false);
// A blocked storage write retains an in-memory draft and reports the limitation.
t=boot(null,true);t.run("openPanel('pitch')");t.elements.get('#flow-form').formData=[['title','Session only']];t.elements.get('#flow-form').oninput();
assert.equal(t.run("loadDraft('pitch').title"),'Session only');assert.match(t.elements.get('#status').textContent,/page session/);
t.elements.get('#clear-draft').onclick();t.run('stash()');assert.equal(JSON.stringify(t.run("loadDraft('pitch')")),'{}');
t=boot();t.run("persistDraft('pitch',{title:'<img src=x onerror=alert(1)>'})");assert.match(t.run('draftCards()'),/&lt;img/);assert.doesNotMatch(t.run('draftCards()'),/<img/);
console.log('PASS: automatic draft recovery, separate flows, clearing, blocked storage, escaped previews');
