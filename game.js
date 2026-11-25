(() => {
  const cfg = window.TROT_CONFIG || {};
  const configured = cfg.SUPABASE_URL && !cfg.SUPABASE_URL.includes("TON-PROJET") &&
    cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_ANON_KEY.includes("COLLE_TA");
  const db = configured && window.supabase ? window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY) : null;
  const $ = id => document.getElementById(id);
  const starter = () => ({
    stable_name:"Écurie débutante",money:12500,tokens:3,level:1,xp:0,wins:0,
    horses:[{id:crypto.randomUUID(),name:"Éclair du Bocage",breed:"Trotteur français",sex:"Hongre",age:3,rarity:"Commun",speed:48,endurance:52,accel:45,potential:68,discipline:"Attelé"}],
    trainer:{name:"Lucas Moreau",bonus:2},driver:{name:"Alex Martin",bonus:2}
  });
  let state = starter(), user = null, demo = !db;
  const horseNames = ["Foudre d'Anjou","Belle Étoile","Idéal du Maine","Horizon Royal","Jasmin des Prés","Légende d'Or","Kaiser du Parc","Miss de Loire","Noble Victoire","Orage du Pin","Prince des Bois","Reine du Trot"];
  const trainers = ["Antoine Leroux","Mathieu Garnier","Julien Perrin","Élodie Marchand","Thomas Renault"];
  const drivers = ["Hugo Bernard","Camille Petit","Maxime Laurent","Arthur Chevalier","Léa Fontaine"];
  const rand = n => Math.floor(Math.random()*n);
  const rarityRoll = () => {const x=Math.random()*100;return x<1?"Mythique":x<7?"Légendaire":x<20?"Épique":x<45?"Rare":"Commun";};
  const rarityBonus = {Commun:0,Rare:5,Épique:10,Légendaire:16,Mythique:23};
  const toast = msg => {const el=$("toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2600);};
  const save = async () => {
    if(db && user) {
      const now = new Date().toISOString();
      const {error}=await db.from("game_states").upsert({user_id:user.id,state,updated_at:now},{onConflict:"user_id"});
      if(error) { toast("Sauvegarde impossible : "+error.message); return; }
      const {error:profileError}=await db.from("player_profiles").upsert({
        user_id:user.id,
        stable_name:state.stable_name || "Nouvelle écurie",
        level:Number(state.level)||1,
        wins:Number(state.wins)||0,
        updated_at:now
      },{onConflict:"user_id"});
      if(profileError) toast("Écurie sauvegardée, profil non synchronisé : "+profileError.message);
    } else localStorage.setItem("trot-legends-demo",JSON.stringify(state));
    render();
  };
  const load = async () => {
    if(db && user) {
      const {data,error}=await db.from("game_states").select("state").eq("user_id",user.id).maybeSingle();
      if(error){toast("Chargement : "+error.message);return;}
      if(data?.state) state={...starter(),...data.state}; else await save();
      // Synchronise le profil public utilisé par le classement.
      const {error:profileError}=await db.from("player_profiles").upsert({
        user_id:user.id,
        stable_name:state.stable_name || "Nouvelle écurie",
        level:Number(state.level)||1,
        wins:Number(state.wins)||0,
        updated_at:new Date().toISOString()
      },{onConflict:"user_id"});
      if(profileError) toast("Profil joueur : "+profileError.message);
    } else {
      try {const s=localStorage.getItem("trot-legends-demo");if(s)state=JSON.parse(s);}catch{}
    }
    render();
  };
  const render = () => {
    $("money").textContent=state.money.toLocaleString("fr-FR")+" €";
    $("tokens").textContent=state.tokens;$("level").textContent=state.level;
    $("stable-name").textContent=state.stable_name;
    $("horse-count").textContent=state.horses.length+" cheval"+(state.horses.length>1?"x":"");
    $("horse-list").innerHTML=state.horses.map(h=>`<article class="horse-card"><div class="horse-avatar">${horseArt(h.sex==="Femelle"?"light":"dark",h.name,"horse-idle")}</div><div class="rarity">${h.rarity} • ${h.discipline}</div><h3>${esc(h.name)}</h3><p>${h.breed} • ${h.age} ans • ${h.sex}</p><div class="stat-row"><span>Vitesse</span><b>${h.speed}</b></div><div class="stat-row"><span>Endurance</span><b>${h.endurance}</b></div><div class="stat-row"><span>Accélération</span><b>${h.accel}</b></div><div class="stat-row"><span>Potentiel</span><b>${h.potential}</b></div></article>`).join("");
    $("trainer-name").textContent=state.trainer?.name||"À recruter";
    $("driver-name").textContent=state.driver?.name||"À recruter";
    if($("race-horse-name")) $("race-horse-name").textContent=state.horses[0]?.name||"Aucun cheval";
    $("player-chip").textContent=user?.email||"Mode découverte";
  };
  const esc = s => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const horseArt = (coat="dark", label="Cheval animé", extra="") => `<svg class="horse-art ${extra}" viewBox="0 0 240 150" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="116" cy="133" rx="94" ry="6" fill="#172b25" opacity=".16"/>
    <g class="sulky"><path d="M18 102 L58 102 L76 112 L35 112Z" fill="#d7b16f" stroke="#493725" stroke-width="2"/><path d="M28 101 L49 76 L66 76" fill="none" stroke="#493725" stroke-width="3"/><circle cx="38" cy="119" r="12" fill="#292b29" stroke="#d6c49c" stroke-width="3"/><circle cx="38" cy="119" r="3" fill="#d6c49c"/><path d="M49 78 Q52 62 64 58 L78 68 L69 89 L54 91Z" fill="#283c54" stroke="#182532" stroke-width="2"/><circle cx="63" cy="49" r="9" fill="#d8aa83"/><path d="M54 47 Q57 34 69 39 L73 49Z" fill="#34271f"/><path d="M54 58 L46 75 L58 81" stroke="#283c54" stroke-width="5" fill="none" stroke-linecap="round"/></g>
    <path d="M57 88 L78 92 L90 108" stroke="#6b4b2d" stroke-width="2" fill="none"/>
    <g class="horse-body"><path d="M73 77 Q66 52 93 42 Q129 28 161 48 Q176 57 172 83 Q163 104 122 103 L87 96Z" fill="${coat==="light"?"#bd8955":"#75462f"}" stroke="#3c2921" stroke-width="2"/><path d="M157 55 Q171 39 183 22 Q195 12 208 22 L217 39 Q210 52 195 53 L179 82Z" fill="${coat==="light"?"#bd8955":"#75462f"}" stroke="#3c2921" stroke-width="2"/><path d="M201 23 Q210 10 220 13 L217 28Z" fill="#4a3026"/><path d="M207 39 Q221 37 229 44 Q223 54 206 51Z" fill="#33231e"/><circle cx="208" cy="31" r="2.7" fill="#fff4df"/><path d="M173 48 Q188 20 201 18 Q189 35 192 54" fill="#30221f"/><path d="M71 60 Q61 41 67 26 Q77 37 85 43 Q97 29 107 30 Q96 47 95 55" fill="#30221f"/><path d="M71 77 Q55 71 47 52 Q45 43 51 38 Q57 59 81 61" fill="none" stroke="#30221f" stroke-width="8" stroke-linecap="round"/></g>
    <g class="horse-legs" stroke="#3b2922" stroke-width="8" stroke-linecap="round" fill="none"><path class="leg leg-a" d="M94 91 L86 119 L75 129"/><path class="leg leg-b" d="M114 96 L121 119 L117 133"/><path class="leg leg-c" d="M151 94 L161 116 L173 127"/><path class="leg leg-d" d="M166 86 L176 108 L169 131"/></g>
  </svg>`;

  const showGame = () => {$("auth-panel").classList.add("hidden");$("game").classList.remove("hidden");$("logout-btn").classList.toggle("hidden",!user);};
  const auth = async mode => {
    if(!db){$("auth-message").textContent="Supabase n'est pas configuré. Tu peux essayer le prototype en mode découverte.";toast("Ajoute les clés Supabase dans config.js pour créer un compte.");return;}
    const email=$("email").value.trim(),password=$("password").value;
    if(!email||password.length<6){$("auth-message").textContent="Entre un e-mail et un mot de passe d'au moins 6 caractères.";return;}
    const result=mode==="signup"?await db.auth.signUp({email,password}):await db.auth.signInWithPassword({email,password});
    if(result.error){$("auth-message").textContent=result.error.message;return;}
    user=result.data.user;
    if(mode==="signup"&&!result.data.session){$("auth-message").textContent="Compte créé. Vérifie ton e-mail pour confirmer l'inscription, puis connecte-toi.";return;}
    if(!user && result.data.session) user=result.data.session.user;
    await load();showGame();
  };
  $("signup-btn").onclick=()=>auth("signup");$("login-btn").onclick=()=>auth("login");
  $("logout-btn").onclick=async()=>{if(db)await db.auth.signOut();user=null;$("game").classList.add("hidden");$("auth-panel").classList.remove("hidden");$("logout-btn").classList.add("hidden");};
  document.querySelectorAll(".tab").forEach(btn=>btn.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===btn));document.querySelectorAll(".tab-page").forEach(x=>x.classList.add("hidden"));$("tab-"+btn.dataset.tab).classList.remove("hidden");if(btn.dataset.tab==="ranking")loadRanking();if(btn.dataset.tab==="races")loadRaces();});
  $("summon-btn").onclick=async()=>{
    if(state.tokens<1){toast("Tu n'as plus de jetons.");return;}
    state.tokens--;const type=rand(100)<72?"horse":rand(2)?"trainer":"driver";
    const rarity=rarityRoll(),bonus=rarityBonus[rarity];let message="";
    if(type==="horse"){
      const name=horseNames[rand(horseNames.length)]+" "+["","du Haras","d'Anjou","des Prés"][rand(4)];
      const h={id:crypto.randomUUID(),name,breed:"Trotteur français",sex:["Mâle","Femelle","Hongre"][rand(3)],age:2+rand(3),rarity,speed:40+rand(16)+bonus,endurance:40+rand(16)+bonus,accel:40+rand(16)+bonus,potential:55+rand(25)+bonus,discipline:rand(2)?"Attelé":"Monté"};
      state.horses.push(h);message=`🐎 ${name} rejoint ton écurie !`;
    } else if(type==="trainer"){
      state.trainer={name:trainers[rand(trainers.length)],bonus:3+bonus};message=`🎓 Nouvel entraîneur : ${state.trainer.name} (${rarity})`;
    } else {state.driver={name:drivers[rand(drivers.length)],bonus:3+bonus};message=`🏁 Nouveau driver : ${state.driver.name} (${rarity})`;}
    $("summon-result").textContent=message+" • "+rarity;$("summon-result").classList.remove("hidden");await save();
  };
  // Courses partagées : inscriptions et résultats sont gérés par Supabase.
  const raceDate = value => new Date(value).toLocaleString("fr-FR",{dateStyle:"medium",timeStyle:"short"});
  async function loadRaces(){
    const box=$("races-list");
    if(!db || !user){box.innerHTML='<div class="panel muted">Connecte-toi pour accéder aux courses multijoueurs.</div>';return;}
    box.innerHTML='<div class="panel muted">Chargement du programme…</div>';
    const {data,error}=await db.rpc("trot_get_races");
    if(error){box.innerHTML=`<div class="panel muted">Impossible de charger les courses : ${esc(error.message)}</div>`;return;}
    const races=data||[];
    // Une course arrivée à son heure est clôturée/calculée côté Supabase au premier rafraîchissement.
    for(const r of races){
      if(r.status!=="finished" && new Date(r.starts_at)<=new Date()){
        const run=await db.rpc("trot_run_race",{p_race_id:r.id});
        if(!run.error) r.status="finished";
      }
    }
    if(!races.length){box.innerHTML='<div class="panel muted">Aucune course programmée pour le moment. Actualise dans quelques instants.</div>';return;}
    box.innerHTML=races.map(r=>{
      const closed=r.status==="finished" || new Date(r.starts_at)<=new Date();
      const options=state.horses.map(h=>`<option value="${esc(h.id)}">${esc(h.name)} — ${esc(h.discipline||"Attelé")}</option>`).join("");
      return `<article class="race-card panel" data-race="${esc(r.id)}">
        <div class="race-meta"><span>${closed?"COURSE TERMINÉE":"INSCRIPTIONS OUVERTES"}</span><span class="pill">${esc(r.discipline||"Attelé")}</span></div>
        <h2>${esc(r.title)}</h2><p>${Number(r.distance_m).toLocaleString("fr-FR")} mètres • Départ ${raceDate(r.starts_at)}</p>
        <div class="race-scene" aria-label="Animation 2D de trotteurs et sulkys sur la piste"><div class="race-scene-sky"><span class="track-label">HIPPODROME • ${esc(r.discipline||"ATTELÉ")}</span><span class="race-cloud cloud-one"></span><span class="race-cloud cloud-two"></span></div><div class="race-track"><div class="track-line"></div><div class="race-runner runner-one">${horseArt("dark","Trotteur et driver en course","horse-running")}</div><div class="race-runner runner-two">${horseArt("light","Trotteur et driver en course","horse-running")}</div><div class="race-runner runner-three">${horseArt("dark","Trotteur et driver en course","horse-running")}</div><div class="finish-post"></div></div><div class="track-bottom"><span>Départ</span><span>Arrivée</span></div></div>
        ${closed?'<div class="race-entry"><span>Statut</span><strong>Arrivée officielle</strong></div>':`<label class="race-select-label">Choisir ton cheval<select class="race-horse-select">${options||'<option value="">Aucun cheval</option>'}</select></label><button class="button primary wide join-race" ${options?'':'disabled'}>Inscrire ce cheval</button>`}
        <button class="button secondary wide participants-race" data-race-id="${esc(r.id)}">Voir les chevaux engagés</button>
        <button class="button secondary wide results-race" data-race-id="${esc(r.id)}">${closed?"Voir les résultats":"Voir les résultats"}</button>
        <div class="race-inline-participants race-inline-result hidden"></div>
        <div class="race-inline-result hidden"></div>
      </article>`;
    }).join("");
    box.querySelectorAll(".join-race").forEach(btn=>btn.addEventListener("click",async()=>{
      const card=btn.closest("[data-race]");const horseId=card.querySelector(".race-horse-select")?.value;
      if(!horseId){toast("Choisis un cheval.");return;}
      btn.disabled=true;btn.textContent="Inscription…";
      const {data,error}=await db.rpc("trot_join_race",{p_race_id:card.dataset.race,p_horse_id:horseId});
      if(error){toast("Inscription refusée : "+error.message);btn.disabled=false;btn.textContent="Inscrire ce cheval";return;}
      toast("Cheval inscrit à la course !");btn.textContent="Cheval inscrit";
    }));
    box.querySelectorAll(".participants-race").forEach(btn=>btn.addEventListener("click",()=>showRaceParticipants(btn.dataset.raceId,btn.closest("[data-race]").querySelector(".race-inline-participants"))));
    box.querySelectorAll(".results-race").forEach(btn=>btn.addEventListener("click",()=>showRaceResults(btn.dataset.raceId,btn.closest("[data-race]").querySelector(".race-inline-result:last-child"))));
  }
  async function showRaceParticipants(raceId,target){
    target.classList.remove("hidden");target.innerHTML='<p class="muted">Chargement des engagés…</p>';
    const {data,error}=await db.rpc("trot_race_participants",{p_race_id:raceId});
    if(error){target.innerHTML=`<p class="muted">Liste indisponible : ${esc(error.message)}</p>`;return;}
    if(!data?.length){target.innerHTML='<h3>Chevaux engagés</h3><p class="muted">Aucun cheval inscrit pour le moment. Chaque joueur peut inscrire un cheval avant le départ.</p>';return;}
    target.innerHTML='<h3>Chevaux engagés · '+data.length+' joueur(s)</h3>'+data.map(row=>`<div class="leaderboard-row"><span>🐎 ${esc(row.horse_name)}<small class="participant-stable">${esc(row.stable_name||"Écurie")}${row.is_mine?" · Ton écurie":""}</small></span><strong>${row.place?row.place+"e":"Engagé"}</strong></div>`).join("");
  }
  async function showRaceResults(raceId,target){
    target.classList.remove("hidden");target.innerHTML='<p class="muted">Chargement des résultats…</p>';
    const {data,error}=await db.rpc("trot_race_results",{p_race_id:raceId});
    if(error){target.innerHTML=`<p class="muted">Résultats indisponibles : ${esc(error.message)}</p>`;return;}
    if(!data?.length){target.innerHTML='<p class="muted">Aucun cheval inscrit pour le moment. Le classement apparaîtra après le départ.</p>';return;}
    target.innerHTML='<h3>Arrivée officielle</h3>'+data.map(row=>`<div class="leaderboard-row"><span>${row.place}. ${esc(row.horse_name)}<small class="participant-stable">${esc(row.stable_name||"Écurie")}</small></span><strong>${Number(row.prize).toLocaleString("fr-FR")} €</strong></div>`).join("");
  }
  $("refresh-races").onclick=loadRaces;
  async function loadRanking(){
    const box=$("leaderboard");
    if(!db){box.innerHTML='<div class="muted">Classement multijoueur disponible après configuration Supabase.</div>';return;}
    const {data,error}=await db.from("public_leaderboard").select("stable_name,level,wins").order("wins",{ascending:false}).limit(20);
    if(error){box.textContent="Classement indisponible : "+error.message;return;}
    box.innerHTML=(data||[]).map((p,i)=>`<div class="leaderboard-row"><span>${i+1}. ${esc(p.stable_name||"Écurie")}</span><strong>Niv. ${p.level} • ${p.wins} victoire(s)</strong></div>`).join("")||'<div class="muted">Aucune écurie classée pour le moment.</div>';
  }
  if(db){
    db.auth.getSession().then(async({data,error})=>{
      if(error){$("auth-message").textContent="Erreur de session : "+error.message;return;}
      if(data.session){user=data.session.user;await load();showGame();}
    });
    db.auth.onAuthStateChange((event,session)=>{
      if(event==="SIGNED_OUT"){user=null;return;}
      if(session && !user){user=session.user;load().then(showGame);}
    });
  } else {
    $("auth-message").textContent="Mode découverte activé : progression enregistrée sur cet appareil. Configure Supabase pour le multijoueur et la synchronisation.";
    const saved=localStorage.getItem("trot-legends-demo");if(saved){try{state=JSON.parse(saved);}catch{}}
    showGame();render();
  }
  // Progression idle simple : récupération et revenu hors ligne à enrichir dans la version serveur.
  if(!localStorage.getItem("trot-idle-start"))localStorage.setItem("trot-idle-start",String(Date.now()));
  const last=Number(localStorage.getItem("trot-idle-start"));const hours=Math.min(24,Math.max(0,(Date.now()-last)/3600000));
  if(hours>=0.1){state.money+=Math.floor(hours*120);localStorage.setItem("trot-idle-start",String(Date.now()));save();}
  if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});
})();
