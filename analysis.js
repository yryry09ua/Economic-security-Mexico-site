(() => {
  const DATA = window.MEXICO_DATA;
  const select = document.getElementById('indicatorSelect');
  const chartWrap = document.getElementById('chartWrap');
  const summaryTable = document.getElementById('summaryTable');
  const methodTitle = document.getElementById('methodTitle');
  const methodText = document.getElementById('methodText');
  const rangeList = document.getElementById('rangeList');
  const methodNote = document.getElementById('methodNote');
  const fmt = (v, digits=2) => Number(v).toLocaleString('uk-UA',{minimumFractionDigits:digits,maximumFractionDigits:digits});
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const thresholdText = a => a.map(x => fmt(x, x < 2 ? 3 : 1)).join(' · ');
  function statusClass(status){
    const s=status.toLowerCase();
    if(s.includes('задов') || s.includes('оптим')) return 'good';
    if(s.includes('незад') || s.includes('небезпеч')) return 'warn';
    return 'bad';
  }
  function fillSelect(){
    DATA.indicators.forEach((d,i)=>{const o=document.createElement('option');o.value=d.id;o.textContent=`${d.short} · ${d.unit}`;select.appendChild(o);});
  }
  function createChart(d){
    const values=d.values.filter(v=>v!==null && Number.isFinite(v));
    const years=d.years.filter((_,i)=>d.values[i]!==null && Number.isFinite(d.values[i]));
    const min0=Math.min(...values),max0=Math.max(...values),span=Math.max(max0-min0,Math.abs(max0)*.08,0.01);
    const min=min0-span*.22,max=max0+span*.22;
    const W=760,H=300,L=62,R=22,T=22,B=46,innerW=W-L-R,innerH=H-T-B;
    const x=i=>L+(years.length===1?innerW/2:i*innerW/(years.length-1));
    const y=v=>T+(max-v)/(max-min)*innerH;
    let grid='';
    for(let i=0;i<5;i++){const val=min+(max-min)*i/4, yy=y(val);grid+=`<line x1="${L}" y1="${yy}" x2="${W-R}" y2="${yy}" stroke="#e7ede6" stroke-width="1"/><text x="${L-10}" y="${yy+4}" text-anchor="end" font-size="11" fill="#77847b">${fmt(val,d.unit==='разів'?2:1)}</text>`;}
    const pts=values.map((v,i)=>`${x(i)},${y(v)}`).join(' ');
    const avgY=y(d.average);
    const labels=years.map((yr,i)=>`<text x="${x(i)}" y="${H-14}" text-anchor="middle" font-size="11" fill="#77847b">${yr}</text>`).join('');
    const dots=values.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="4.2" fill="#1e6a4c" stroke="white" stroke-width="2"><title>${years[i]}: ${fmt(v,3)} ${esc(d.unit)}</title></circle>`).join('');
    chartWrap.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Динаміка: ${esc(d.name)}"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#87b99b" stop-opacity=".25"/><stop offset="1" stop-color="#87b99b" stop-opacity="0"/></linearGradient></defs>${grid}<line x1="${L}" y1="${avgY}" x2="${W-R}" y2="${avgY}" stroke="#c18a42" stroke-width="2" stroke-dasharray="6 5"/><polygon points="${L},${H-B} ${pts} ${W-R},${H-B}" fill="url(#area)"/><polyline points="${pts}" fill="none" stroke="#1e6a4c" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>${dots}${labels}<text x="${L}" y="14" font-size="10" fill="#a17840">Середнє: ${fmt(d.average,3)} ${esc(d.unit)}</text></svg>`;
  }
  function renderDetail(d){
    createChart(d);
    methodTitle.textContent=d.short;
    methodText.innerHTML=`Середнє: <strong>${fmt(d.average,3)} ${esc(d.unit)}</strong> · <span class="pill ${statusClass(d.status)}">${esc(d.status)}</span><br><br>${esc(d.summary)}`;
    rangeList.innerHTML=`<div class="range-row"><span>Характеристичні межі</span><strong>${esc(thresholdText(d.thresholds))}</strong></div><div class="range-row"><span>Тип індикатора</span><strong>${d.orientation==='lower'?'Дестимулятор (менше — краще)':d.orientation==='higher'?'Стимулятор (більше — краще)':'Двосторонні межі'}</strong></div><div class="range-row"><span>Доступні роки</span><strong>${d.years[0]}–${d.years[d.years.length-1]} (${d.years.length} спост.)</strong></div><div class="range-row"><span>Тенденція</span><strong>${esc(d.trend)}</strong></div>`;
    methodNote.textContent=d.note;
  }
  function renderTable(){
    summaryTable.innerHTML=DATA.indicators.map(d=>`<tr><td class="metric-name">${esc(d.name)}<div class="note-text">${esc(d.group)}</div></td><td><strong>${fmt(d.average,3)} ${esc(d.unit)}</strong><div class="note-text">${d.years.length} спостережень</div></td><td><span class="note-text">${esc(thresholdText(d.thresholds))}</span></td><td><span class="pill ${statusClass(d.status)}">${esc(d.status)}</span></td><td><strong>${esc(d.trend)}</strong></td></tr>`).join('');
  }
  function downloadCsv(){
    const rows=[['Індикатор','Середнє','Одиниця','Порогові значення','Рівень','Тенденція','Роки спостережень'],...DATA.indicators.map(d=>[d.name,String(d.average).replace('.',','),d.unit,d.thresholds.join('; '),d.status,d.trend,d.years.join('; ')])];
    const csv='\ufeff'+rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\r\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='ekonomichna_bezpeka_meksyky.csv';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  }
  fillSelect();renderTable();renderDetail(DATA.indicators[0]);
  select.addEventListener('change',()=>renderDetail(DATA.indicators.find(d=>d.id===select.value)));
  document.getElementById('downloadCsv').addEventListener('click',downloadCsv);
})();
