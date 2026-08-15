(function(){
  var mega = document.querySelector('.nav-mega');
  if (mega) {
    var trigger = mega.querySelector('.nav-mega-trigger');
    var links = Array.prototype.slice.call(mega.querySelectorAll('.mega-panel a'));
    function setOpen(open){ mega.classList.toggle('open', open); if(trigger) trigger.setAttribute('aria-expanded', open ? 'true' : 'false'); }
    trigger && trigger.addEventListener('click', function(e){ e.preventDefault(); setOpen(!mega.classList.contains('open')); });
    document.addEventListener('click', function(e){ if(!mega.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && mega.classList.contains('open')){ setOpen(false); trigger && trigger.focus(); }
      if(!mega.classList.contains('open') || !links.length) return;
      var i = links.indexOf(document.activeElement);
      if(e.key === 'ArrowDown'){ e.preventDefault(); links[(i + 1 + links.length) % links.length].focus(); }
      if(e.key === 'ArrowUp'){ e.preventDefault(); links[(i - 1 + links.length) % links.length].focus(); }
    });
  }

  var items = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox]'));
  if (!items.length) return;
  var box = document.createElement('div');
  box.className = 'wing-lightbox';
  box.setAttribute('role','dialog');
  box.setAttribute('aria-modal','true');
  box.setAttribute('aria-label','Image gallery viewer');
  box.innerHTML = '<button type="button" class="wing-lightbox-close" aria-label="Close image">×</button><button type="button" class="wing-lightbox-prev" aria-label="Previous image">‹</button><figure><img alt=""><figcaption></figcaption></figure><button type="button" class="wing-lightbox-next" aria-label="Next image">›</button>';
  document.body.appendChild(box);
  var img = box.querySelector('img');
  var cap = box.querySelector('figcaption');
  var close = box.querySelector('.wing-lightbox-close');
  var prev = box.querySelector('.wing-lightbox-prev');
  var next = box.querySelector('.wing-lightbox-next');
  var activeIndex = 0;
  var lastFocus = null;
  function itemData(index){
    var btn = items[index];
    var i = btn && btn.querySelector('img');
    var c = btn && btn.querySelector('figcaption');
    return {src:i ? i.currentSrc || i.src : '', alt:i ? i.alt || '' : '', caption:c ? c.textContent : ''};
  }
  function openAt(index){
    if(index < 0) index = items.length - 1;
    if(index >= items.length) index = 0;
    activeIndex = index;
    var data = itemData(activeIndex);
    if(!data.src) return;
    lastFocus = document.activeElement;
    img.src = data.src;
    img.alt = data.alt;
    cap.textContent = data.caption || data.alt;
    box.classList.add('open');
    document.body.style.overflow = 'hidden';
    close.focus();
  }
  function closeBox(){
    box.classList.remove('open');
    img.removeAttribute('src');
    document.body.style.overflow = '';
    if(lastFocus && lastFocus.focus) lastFocus.focus();
  }
  items.forEach(function(btn, index){ btn.addEventListener('click', function(){ openAt(index); }); });
  close.addEventListener('click', closeBox);
  prev.addEventListener('click', function(){ openAt(activeIndex - 1); });
  next.addEventListener('click', function(){ openAt(activeIndex + 1); });
  box.addEventListener('click', function(e){ if(e.target === box) closeBox(); });
  document.addEventListener('keydown', function(e){
    if(!box.classList.contains('open')) return;
    if(e.key === 'Escape') closeBox();
    if(e.key === 'ArrowLeft') openAt(activeIndex - 1);
    if(e.key === 'ArrowRight') openAt(activeIndex + 1);
    if(e.key === 'Tab') {
      var focusables = [close, prev, next];
      var current = focusables.indexOf(document.activeElement);
      if(e.shiftKey && current === 0){ e.preventDefault(); next.focus(); }
      else if(!e.shiftKey && current === focusables.length - 1){ e.preventDefault(); close.focus(); }
    }
  });
  var touchStartX = null;
  box.addEventListener('touchstart', function(e){ touchStartX = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : null; }, {passive:true});
  box.addEventListener('touchend', function(e){
    if(touchStartX === null) return;
    var endX = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : touchStartX;
    var delta = endX - touchStartX;
    if(Math.abs(delta) > 45) openAt(activeIndex + (delta < 0 ? 1 : -1));
    touchStartX = null;
  }, {passive:true});
})();
