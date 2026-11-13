// ========================================================
// CITASYA - GESTOR DE SWIPES & FÍSICAS DE TARJETAS
// ========================================================

class SwipeCardController {
  constructor(containerEl, onSwipeCallback) {
    this.container = containerEl;
    this.onSwipe = onSwipeCallback;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.activeCard = null;
    this.badgeLike = null;
    this.badgeNope = null;
    this.badgeSuperlike = null;

    this.bindGlobalEvents();
  }

  bindGlobalEvents() {
    // Mouse events
    document.addEventListener('mousemove', (e) => this.onMove(e.clientX, e.clientY));
    document.addEventListener('mouseup', () => this.onEnd());

    // Touch events
    document.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        this.onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });

    document.addEventListener('touchend', () => this.onEnd());
    document.addEventListener('touchcancel', () => this.onEnd());
  }

  attachCard(cardEl) {
    this.activeCard = cardEl;
    if (!cardEl) return;

    this.badgeLike = cardEl.querySelector('.badge-like');
    this.badgeNope = cardEl.querySelector('.badge-nope');
    this.badgeSuperlike = cardEl.querySelector('.badge-superlike');

    // Escuchar inicio de arrastre en la tarjeta
    cardEl.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.onStart(e.clientX, e.clientY);
    });

    cardEl.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        this.onStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });
  }

  onStart(x, y) {
    if (!this.activeCard) return;
    this.isDragging = true;
    this.startX = x;
    this.startY = y;
    this.currentX = x;
    this.currentY = y;
    this.activeCard.style.transition = 'none';
  }

  onMove(x, y) {
    if (!this.isDragging || !this.activeCard) return;

    this.currentX = x;
    this.currentY = y;

    const deltaX = this.currentX - this.startX;
    const deltaY = this.currentY - this.startY;
    const rotate = deltaX * 0.08;

    this.activeCard.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotate}deg)`;

    // Calcular opacidad de badges según la dirección y distancia
    const threshold = 60;
    
    // Superlike (hacia arriba)
    if (deltaY < -40 && Math.abs(deltaX) < 80) {
      const opacity = Math.min(Math.abs(deltaY) / 120, 1);
      if (this.badgeSuperlike) this.badgeSuperlike.style.opacity = opacity;
      if (this.badgeLike) this.badgeLike.style.opacity = 0;
      if (this.badgeNope) this.badgeNope.style.opacity = 0;
    }
    // Like (hacia la derecha)
    else if (deltaX > 20) {
      const opacity = Math.min(deltaX / threshold, 1);
      if (this.badgeLike) this.badgeLike.style.opacity = opacity;
      if (this.badgeNope) this.badgeNope.style.opacity = 0;
      if (this.badgeSuperlike) this.badgeSuperlike.style.opacity = 0;
    } 
    // Nope (hacia la izquierda)
    else if (deltaX < -20) {
      const opacity = Math.min(Math.abs(deltaX) / threshold, 1);
      if (this.badgeNope) this.badgeNope.style.opacity = opacity;
      if (this.badgeLike) this.badgeLike.style.opacity = 0;
      if (this.badgeSuperlike) this.badgeSuperlike.style.opacity = 0;
    } else {
      if (this.badgeLike) this.badgeLike.style.opacity = 0;
      if (this.badgeNope) this.badgeNope.style.opacity = 0;
      if (this.badgeSuperlike) this.badgeSuperlike.style.opacity = 0;
    }
  }

  onEnd() {
    if (!this.isDragging || !this.activeCard) return;
    this.isDragging = false;

    const deltaX = this.currentX - this.startX;
    const deltaY = this.currentY - this.startY;
    const card = this.activeCard;

    const swipeThreshold = 100;
    const superlikeThreshold = -120;

    // Superlike
    if (deltaY < superlikeThreshold && Math.abs(deltaX) < 100) {
      this.throwCard(card, 'superlike', 0, -window.innerHeight);
    }
    // Like
    else if (deltaX > swipeThreshold) {
      this.throwCard(card, 'like', window.innerWidth + 200, deltaY);
    }
    // Pass / Nope
    else if (deltaX < -swipeThreshold) {
      this.throwCard(card, 'pass', -window.innerWidth - 200, deltaY);
    }
    // Retorno al centro si no superó el umbral
    else {
      card.style.transition = 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      card.style.transform = 'translate(0, 0) rotate(0deg)';
      if (this.badgeLike) this.badgeLike.style.opacity = 0;
      if (this.badgeNope) this.badgeNope.style.opacity = 0;
      if (this.badgeSuperlike) this.badgeSuperlike.style.opacity = 0;
    }
  }

  // Disparo manual desde botones
  swipeManual(direction) {
    if (!this.activeCard) return;
    const card = this.activeCard;

    if (direction === 'like') {
      if (this.badgeLike) this.badgeLike.style.opacity = 1;
      this.throwCard(card, 'like', window.innerWidth + 200, 20);
    } else if (direction === 'pass') {
      if (this.badgeNope) this.badgeNope.style.opacity = 1;
      this.throwCard(card, 'pass', -window.innerWidth - 200, 20);
    } else if (direction === 'superlike') {
      if (this.badgeSuperlike) this.badgeSuperlike.style.opacity = 1;
      this.throwCard(card, 'superlike', 0, -window.innerHeight);
    }
  }

  throwCard(card, direction, targetX, targetY) {
    const rotate = direction === 'like' ? 25 : (direction === 'pass' ? -25 : 0);
    card.style.transition = 'transform 0.4s ease-out, opacity 0.35s ease-out';
    card.style.transform = `translate(${targetX}px, ${targetY}px) rotate(${rotate}deg)`;
    card.style.opacity = '0';

    setTimeout(() => {
      const profileData = card.__profileData;
      if (card.parentNode) {
        card.parentNode.removeChild(card);
      }
      this.activeCard = null;
      if (typeof this.onSwipe === 'function') {
        this.onSwipe(direction, profileData);
      }
    }, 380);
  }
}

