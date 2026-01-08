if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}

const KEY="dos_v1_flat";
const today=()=>new Date().toISOString().slice(0,10);

const state=JSON.parse(localStorage.getItem(KEY))||{
  tab:"today",
  habits:[
    "Grind",
    "Deep Work",
    "Workout",
    "Sleep ≥ 7h"
  ],
  entries:{}
};

let day=today();

/* Helpers */
function save(){localStorage.setItem(KEY,JSON.stringify(state));}

function entry(d){
  if(!state.entries[d]){
    state.entries[d]={done:{},submitted:false,notes:""};
  }
  return state.entries[d];
}

function toast(msg){
  const t=document.getElementById("toast");
  t.textContent=msg;
  t.style.display="block";
  setTimeout(()=>t.style.display="none",2000);
}

function score(d){
  return `${Object.values(entry(d).done).filter(Boolean).length}/${state.habits.length}`;
}

function last7(){
  return [...Array(7)].map((_,i)=>{
    const d=new Date();
    d.setDate(d.getDate()-i);
    return d.toISOString().slice(0,10);
  }).reverse();
}

/* Render */
function render(){
  const app=document.getElementById("app");
  app.innerHTML="";

  app.innerHTML+=`
    <div class="top">
      <div class="brand">
        <div class="title">DOS</div>
        <div class="sub">Discipline OS</div>
      </div>
      <div class="status">${score(day)}</div>
    </div>
  `;

  const tabs=document.createElement("div");
  tabs.className="tabs";
  ["today","week","habits","settings"].forEach(t=>{
    const b=document.createElement("button");
    b.className="tab"+(state.tab===t?" active":"");
    b.textContent=t.toUpperCase();
    b.onclick=()=>{state.tab=t;save();render();}
    tabs.appendChild(b);
  });
  app.appendChild(tabs);

  /* TODAY */
  if(state.tab==="today"){
    const e=entry(day);
    const d=new Date(day);

    const c=document.createElement("div");
    c.className="card";
    c.innerHTML=`
      <div class="day-name">${day===today()?"Today":d.toLocaleDateString(undefined,{weekday:"long"})}</div>
      <div class="day-date">${d.toLocaleDateString(undefined,{month:"long",day:"numeric",year:"numeric"})}</div>
      <div style="font-size:26px;font-weight:800">${score(day)}</div>
    `;

    state.habits.forEach(h=>{
      const row=document.createElement("div");
      row.className="habit";
      row.innerHTML=`
        <div>
          ${h}
          <div class="meta">${e.submitted?"LOCKED":"Editable"}</div>
        </div>
        <div class="toggle ${e.done[h]?"on":""} ${e.submitted?"locked":""}"></div>
      `;
      row.querySelector(".toggle").onclick=()=>{
        if(e.submitted)return toast("Unsubmit to edit");
        e.done[h]=!e.done[h];
        save();
        render();
      };
      c.appendChild(row);
    });

    const submit=document.createElement("button");
    submit.className=e.submitted?"btn warn":"btn primary";
    submit.textContent=e.submitted?"UNSUBMIT DAY":"SUBMIT DAY";
    submit.onclick=()=>{
      if(e.submitted){
        if(!confirm("Unsubmit this day?"))return;
        e.submitted=false;
        toast("Day unsubmitted");
      }else{
        e.submitted=true;
        toast("Day submitted");
      }
      save();
      render();
    };
    c.appendChild(submit);

    const notes=document.createElement("textarea");
    notes.placeholder="Notes for the day…";
    notes.value=e.notes;
    notes.oninput=()=>{e.notes=notes.value;save();}
    c.appendChild(notes);

    app.appendChild(c);
  }

  /* WEEK */
  if(state.tab==="week"){
    const c=document.createElement("div");
    c.className="card";
    last7().forEach(d=>{
      const e=state.entries[d];
      const pct=e?Math.round((Object.values(e.done).filter(Boolean).length/state.habits.length)*100):0;
      c.innerHTML+=`
        <div class="bar">
          <span>${new Date(d).toLocaleDateString(undefined,{weekday:"short"})}</span>
          <div class="track">
            <div class="fill ${pct>=80?"good":pct>=50?"mid":"bad"}" style="width:${pct}%"></div>
          </div>
        </div>
      `;
    });
    app.appendChild(c);
  }

  /* HABITS */
  if(state.tab==="habits"){
    const c=document.createElement("div");
    c.className="card";
    state.habits.forEach(h=>{
      const row=document.createElement("div");
      row.className="habit";
      row.innerHTML=`${h}<button class="btn danger">DELETE</button>`;
      row.querySelector("button").onclick=()=>{
        if(confirm("Delete habit?")){
          state.habits=state.habits.filter(x=>x!==h);
          save();
          render();
        }
      };
      c.appendChild(row);
    });
    const add=document.createElement("button");
    add.className="btn secondary";
    add.textContent="ADD HABIT";
    add.onclick=()=>{
      const n=prompt("Habit name?");
      if(n){
        state.habits.push(n);
        save();
        render();
      }
    };
    c.appendChild(add);
    app.appendChild(c);
  }

  /* SETTINGS */
  if(state.tab==="settings"){
    const c=document.createElement("div");
    c.className="card";
    const reset=document.createElement("button");
    reset.className="btn danger";
    reset.textContent="RESET ALL DATA";
    reset.onclick=()=>{
      if(confirm("Reset everything?")){
        localStorage.removeItem(KEY);
        location.reload();
      }
    };
    c.appendChild(reset);
    app.appendChild(c);
  }
}

render();
