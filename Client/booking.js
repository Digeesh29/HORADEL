// Batch handling (in-memory)
const addParcelBtn = document.getElementById('addParcelBtn');
const batchTableBody = document.getElementById('batchTableBody');
const batchEmpty = document.getElementById('batchEmpty');
const batchTableWrapper = document.getElementById('batchTableWrapper');
const submitBatch = document.getElementById('submitBatch');
const clearBatch = document.getElementById('clearBatch');

let batch = [];

function escapeHtml(str){
  return String(str).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
}

addParcelBtn.addEventListener('click', ()=>{
  const company = document.getElementById('company').value.trim();
  const address = document.getElementById('address').value.trim();
  const city = document.getElementById('city').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const articles = parseInt(document.getElementById('articles').value||0,10);
  const parcelType = document.getElementById('parcelType').value;

  if(!company||!address||!city||!phone||!articles){
    alert('Please fill all required fields.');
    return;
  }

  batch.push({company,address,city,phone,articles,parcelType});
  renderBatch();
  document.getElementById('parcelForm').reset();
});

function renderBatch(){
  if(batch.length === 0){
    batchEmpty.style.display = '';
    batchTableWrapper.style.display = 'none';
    return;
  }
  batchEmpty.style.display = 'none';
  batchTableWrapper.style.display = '';
  batchTableBody.innerHTML = '';
  batch.forEach((p,i)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i+1}</td>
      <td>${escapeHtml(p.company)}</td>
      <td>${escapeHtml(p.city)}</td>
      <td>${p.articles}</td>
      <td>${escapeHtml(p.parcelType)}</td>
      <td class="text-end"><button class="btn btn-sm btn-outline-danger remove" data-i="${i}">Remove</button></td>
    `;
    batchTableBody.appendChild(tr);
  });

  // remove buttons
  batchTableBody.querySelectorAll('.remove').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const idx = Number(e.currentTarget.getAttribute('data-i'));
      batch.splice(idx,1);
      renderBatch();
    });
  });
}

submitBatch.addEventListener('click', ()=>{
  if(batch.length === 0){ alert('No parcels to submit'); return; }
  alert('Batch submitted ('+ batch.length + ' parcels).');
  batch = [];
  renderBatch();
});

clearBatch.addEventListener('click', ()=>{
  if(!confirm('Clear all parcels in batch?')) return;
  batch = [];
  renderBatch();
});

// small nicety: hide LR chip on small screens
(function adjustLRdisplay(){
  const lrChip = document.getElementById('lrChip');
  function check(){
    if(window.innerWidth < 420){
      lrChip.style.display = 'none';
    } else {
      lrChip.style.display = '';
    }
  }
  window.addEventListener('resize', check);
  check();
})();

renderBatch();
