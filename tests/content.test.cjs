// Render/eligibility tests using isolated public-content fixtures, never deployed content.
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const root=require('node:path').join(__dirname,'..');
function boot(config, storageFailure=false){
 const elements=new Map();const el=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',elements:[],addEventListener(){},classList:{toggle(){}},replaceChildren(){},showModal(){this.open=true;}});return elements.get(id);};
 const ctx=vm.createContext({window:{},document:{querySelector:el,body:{classList:{toggle(){}}},addEventListener(){}},URL,URLSearchParams,location:{search:'?embed=1'},Intl,Date,Map,console,localStorage:{getItem(){if(storageFailure)throw Error('blocked');return null;}}});
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
