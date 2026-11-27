// ========================================================
// CITASYA - CONTROLADOR PRINCIPAL DE LA APLICACIÓN
// ========================================================

document.addEventListener('DOMContentLoaded', async () => {
  // Estado Global
  let currentUser = null;
  let activeMatchId = null;
  let chatPollInterval = null;
  let currentGenderFilter = 'todos';
  let swipeController = null;
  let loadedProfiles = [];

  // Elementos DOM Principales
  const cardStack = document.getElementById('card-stack');
  const dbStatusText = document.getElementById('db-status-text');
  const dbDot = document.querySelector('.db-dot');
  const navMatchesBadge = document.getElementById('nav-matches-badge');
  const matchesTotalBadge = document.getElementById('matches-total-badge');
  const newMatchesCarousel = document.getElementById('new-matches-carousel');
  const conversationsList = document.getElementById('conversations-list');
  const activeChatBox = document.getElementById('active-chat-box');
  const chatEmptyState = document.getElementById('chat-empty-state');
  const chatMessagesBody = document.getElementById('chat-messages-body');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatHeaderAvatar = document.getElementById('chat-header-avatar');
  const chatHeaderName = document.getElementById('chat-header-name');
  const chatViewport = document.getElementById('chat-viewport');
  const btnBackToMatches = document.getElementById('btn-back-to-matches');
  
  // Modales
  const matchCelebrationModal = document.getElementById('match-celebration-modal');
  const detailModal = document.getElementById('detail-modal');
  const detailModalContent = document.getElementById('detail-modal-content');
  const authModal = document.getElementById('auth-modal');
  const toastContainer = document.getElementById('toast-container');

  // Inicializar Swipe Controller
  swipeController = new SwipeCardController(cardStack, handleCardSwiped);

  // ========================================================
  // INICIALIZACIÓN Y AUTENTICACIÓN
  // ========================================================
  async function initApp() {
    await checkDatabaseStatus();
    await checkAuth();
    await setupDemoSelector();
    setupNavigation();
    setupEventListeners();
  }

  async function checkDatabaseStatus() {
    try {
      const res = await API.getStatus();
      if (res && res.database) {
        if (res.database.provider === 'supabase') {
          dbStatusText.textContent = 'Supabase Cloud';
          dbDot.classList.add('connected');
        } else {
          dbStatusText.textContent = 'DB Local Activa';
          dbDot.classList.add('connected');
        }
      }
    } catch (e) {
      dbStatusText.textContent = 'Modo Offline';
    }
  }

  async function checkAuth() {
    const token = API.getToken();
    if (token) {
      try {
        currentUser = await API.getMe();
        updateUserUI();
        await loadDiscoverCards();
        await loadMatchesList();
        return;
      } catch (err) {
        console.warn('Token expirado o inválido:', err.message);
        API.logout();
      }
    }
    openAuthModal();
  }

  function updateUserUI() {
    if (!currentUser) return;
    const headerAvatar = document.getElementById('header-avatar');
    const headerUserName = document.getElementById('header-user-name');
    
    if (currentUser.photos && currentUser.photos.length > 0) {
      headerAvatar.src = currentUser.photos[0];
    }
    headerUserName.textContent = currentUser.name.split(' ')[0];

    // Actualizar vista de perfil
    const previewImg = document.getElementById('profile-preview-img');
    const previewName = document.getElementById('profile-preview-name');
    const previewOcc = document.getElementById('profile-preview-occupation');
    const previewCity = document.getElementById('profile-preview-city');
    const previewBio = document.getElementById('profile-preview-bio');

    if (previewImg && currentUser.photos && currentUser.photos[0]) {
      previewImg.src = currentUser.photos[0];
    }
    if (previewName) previewName.textContent = `${currentUser.name}, ${currentUser.age}`;
    if (previewOcc) previewOcc.innerHTML = `<i class="fa-solid fa-briefcase"></i> ${currentUser.occupation || 'Sin ocupación'}`;
    if (previewCity) previewCity.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${currentUser.city || 'Ciudad de México'}`;
    if (previewBio) previewBio.textContent = currentUser.bio || 'Sin biografía aún.';

    // Rellenar formulario de edición
    document.getElementById('edit-name').value = currentUser.name || '';
    document.getElementById('edit-age').value = currentUser.age || 20;
    document.getElementById('edit-gender').value = currentUser.gender || 'hombre';
    document.getElementById('edit-interested-in').value = currentUser.interested_in || 'todos';
    document.getElementById('edit-city').value = currentUser.city || '';
    document.getElementById('edit-occupation').value = currentUser.occupation || '';
    document.getElementById('edit-photo-url').value = (currentUser.photos && currentUser.photos[0]) || '';
    document.getElementById('edit-bio').value = currentUser.bio || '';
    document.getElementById('edit-interests').value = (currentUser.interests && currentUser.interests.join(', ')) || '';
  }

  // ========================================================
  // DESCUBRIR & CARGA DE TARJETAS
  // ========================================================
  async function loadDiscoverCards() {
    cardStack.innerHTML = `
      <div class="card-loading">
        <div class="loading-heart"><i class="fa-solid fa-heart fa-beat"></i></div>
        <p>Buscando perfiles cerca de ti...</p>
      </div>
    `;

    try {
      const profiles = await API.getDiscoverProfiles(currentGenderFilter);
      loadedProfiles = profiles;
      renderCardStack(profiles);
    } catch (err) {
      cardStack.innerHTML = `
        <div class="card-empty-deck">
          <h3>Error al cargar perfiles</h3>
          <p>${err.message}</p>
        </div>
      `;
    }
  }

  function renderCardStack(profiles) {
    cardStack.innerHTML = '';

    if (!profiles || profiles.length === 0) {
      cardStack.innerHTML = `
        <div class="card-empty-deck">
          <div class="loading-heart"><i class="fa-regular fa-compass"></i></div>
          <h3>No hay más perfiles por ahora</h3>
          <p>Has visto todos los perfiles disponibles con los filtros actuales.</p>
          <button class="btn-primary" id="btn-empty-reset" style="margin-top: 1rem;">
            <i class="fa-solid fa-rotate-left"></i> Reiniciar perfiles para seguir probando
          </button>
        </div>
      `;
      document.getElementById('btn-empty-reset')?.addEventListener('click', handleResetSwipes);
      return;
    }

    // Renderizamos de atrás hacia adelante para que el primer elemento quede arriba
    for (let i = profiles.length - 1; i >= 0; i--) {
      const p = profiles[i];
      const card = createCardElement(p, i === 0);
      cardStack.appendChild(card);
    }

    // El primer card es el activo
    const topCard = cardStack.lastElementChild;
    if (topCard && topCard.classList.contains('dating-card')) {
      swipeController.attachCard(topCard);
    }
  }

  function createCardElement(profile, isTop) {
    const card = document.createElement('div');
    card.className = 'dating-card';
    card.__profileData = profile;

    const photoUrl = (profile.photos && profile.photos.length > 0)
      ? profile.photos[0]
      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';

    const tagsHtml = (profile.interests || [])
      .map(tag => `<span class="tag-pill">${escapeHtml(tag)}</span>`)
      .join('');

    card.innerHTML = `
      <div class="card-img-wrapper">
        <img src="${escapeHtml(photoUrl)}" alt="${escapeHtml(profile.name)}" class="card-image" loading="lazy">
        <div class="card-gradient-overlay"></div>
        
        <!-- Badges -->
        <div class="card-badge badge-like">LIKE</div>
        <div class="card-badge badge-nope">NOPE</div>
        <div class="card-badge badge-superlike">SUPER LIKE</div>

        <!-- Contenido -->
        <div class="card-content">
          <div class="card-name-row">
            <span class="card-name">${escapeHtml(profile.name)}</span>
            <span class="card-age">${profile.age}</span>
            <i class="fa-solid fa-circle-check card-verified" title="Perfil Verificado"></i>
          </div>

          ${profile.occupation ? `
            <div class="card-meta-line">
              <i class="fa-solid fa-briefcase"></i>
              <span>${escapeHtml(profile.occupation)}</span>
            </div>
          ` : ''}

          <div class="card-meta-line">
            <i class="fa-solid fa-location-dot"></i>
            <span>${escapeHtml(profile.city || 'Ciudad de México')}</span>
          </div>

          <p class="card-bio">${escapeHtml(profile.bio || '')}</p>

          <div class="card-tags">${tagsHtml}</div>
        </div>
      </div>
    `;

    return card;
  }

  // Al completar un swipe
  async function handleCardSwiped(direction, profile) {
    if (!profile) return;

    try {
      const res = await API.swipe(profile.id, direction);

      if (res && res.isMatch && res.match) {
        showMatchCelebration(res.match);
        await loadMatchesList();
      }
    } catch (err) {
      console.error('Error al enviar swipe:', err);
    }

    // Enganchar la siguiente tarjeta superior
    const nextTopCard = cardStack.lastElementChild;
    if (nextTopCard && nextTopCard.classList.contains('dating-card')) {
      swipeController.attachCard(nextTopCard);
    } else {
      // Si ya no quedan tarjetas en el DOM
      renderCardStack([]);
    }
  }

  async function handleResetSwipes() {
    try {
      await API.resetSwipes();
      showToast('Perfiles reiniciados con éxito', 'success');
      await loadDiscoverCards();
    } catch (err) {
      showToast('Error al reiniciar: ' + err.message, 'error');
    }
  }

  // ========================================================
  // CELEBRACIÓN DE MATCH (¡ES UN MATCH!)
  // ========================================================
  function showMatchCelebration(matchData) {
    const celebrationName = document.getElementById('match-celebration-name');
    const myAvatar = document.getElementById('match-my-avatar');
    const theirAvatar = document.getElementById('match-their-avatar');

    celebrationName.textContent = matchData.user.name;

    if (matchData.currentUser && matchData.currentUser.photo) {
      myAvatar.src = matchData.currentUser.photo;
    } else if (currentUser && currentUser.photos && currentUser.photos[0]) {
      myAvatar.src = currentUser.photos[0];
    }

    if (matchData.user && matchData.user.photo) {
      theirAvatar.src = matchData.user.photo;
    }

    matchCelebrationModal.classList.remove('hidden');
    triggerConfetti();

    // Configurar acción de chat
    const btnOpenChat = document.getElementById('btn-match-open-chat');
    btnOpenChat.onclick = () => {
      matchCelebrationModal.classList.add('hidden');
      switchView('view-matches');
      openChatConversation(matchData.matchId, matchData.user);
    };

    const btnContinue = document.getElementById('btn-match-continue');
    btnContinue.onclick = () => {
      matchCelebrationModal.classList.add('hidden');
    };
  }

  function triggerConfetti() {
    const container = document.getElementById('confetti-container');
    container.innerHTML = '';
    const colors = ['#fd297b', '#ff5864', '#00cec9', '#f59e0b', '#a29bfe', '#2ed573'];

    for (let i = 0; i < 45; i++) {
      const piece = document.createElement('div');
      piece.style.position = 'absolute';
      piece.style.width = Math.random() * 8 + 6 + 'px';
      piece.style.height = Math.random() * 8 + 6 + 'px';
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      piece.style.left = Math.random() * 100 + '%';
      piece.style.top = '-20px';
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      piece.style.opacity = Math.random() + 0.5;
      piece.style.transform = `rotate(${Math.random() * 360}deg)`;
      piece.style.transition = `top ${Math.random() * 2 + 1.5}s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform ${Math.random() * 2 + 1.5}s ease`;

      container.appendChild(piece);

      setTimeout(() => {
        piece.style.top = Math.random() * 80 + 20 + '%';
        piece.style.transform = `rotate(${Math.random() * 720}deg) scale(0.8)`;
      }, 20);
    }
  }

  // ========================================================
  // MATCHES Y CHAT
  // ========================================================
  async function loadMatchesList() {
    try {
      const matches = await API.getMatches();
      
      navMatchesBadge.textContent = matches.length;
      matchesTotalBadge.textContent = matches.length;

      // Renderizar burbujas de Nuevos Matches
      newMatchesCarousel.innerHTML = '';
      if (matches.length === 0) {
        newMatchesCarousel.innerHTML = '<span style="font-size: 0.8rem; color: #94a3b8; padding-left: 0.5rem;">Sin matches aún</span>';
      } else {
        matches.forEach(m => {
          const bubble = document.createElement('div');
          bubble.className = 'match-bubble';
          const avatarUrl = (m.user.photos && m.user.photos[0]) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';
          bubble.innerHTML = `
            <div class="match-bubble-avatar-wrap">
              <img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(m.user.name)}" class="match-bubble-avatar">
            </div>
            <span class="match-bubble-name">${escapeHtml(m.user.name.split(' ')[0])}</span>
          `;
          bubble.addEventListener('click', () => openChatConversation(m.match_id, m.user));
          newMatchesCarousel.appendChild(bubble);
        });
      }

      // Renderizar lista de conversaciones
      conversationsList.innerHTML = '';
      if (matches.length === 0) {
        conversationsList.innerHTML = `
          <div class="empty-matches">
            <i class="fa-regular fa-comment-dots" style="font-size: 2rem; color: #64748b; margin-bottom: 0.5rem;"></i>
            <p>Aún no tienes mensajes.<br>¡Desliza a la derecha para conseguir un match!</p>
          </div>
        `;
      } else {
        matches.forEach(m => {
          const item = document.createElement('div');
          item.className = `conversation-item ${activeMatchId === m.match_id ? 'active' : ''}`;
          item.dataset.matchId = m.match_id;

          const avatarUrl = (m.user.photos && m.user.photos[0]) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';
          const lastMsgText = m.last_message ? m.last_message.text : '¡Nuevo match! Rompe el hielo saludando.';

          item.innerHTML = `
            <img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(m.user.name)}" class="conversation-avatar">
            <div class="conversation-details">
              <div class="conversation-header">
                <span class="conversation-name">${escapeHtml(m.user.name)}</span>
                <span class="conversation-time">${formatTime(m.created_at)}</span>
              </div>
              <p class="conversation-last-msg">${escapeHtml(lastMsgText)}</p>
            </div>
          `;

          item.addEventListener('click', () => openChatConversation(m.match_id, m.user));
          conversationsList.appendChild(item);
        });
      }

    } catch (err) {
      console.error('Error al cargar matches:', err);
    }
  }

  async function openChatConversation(matchId, otherUser) {
    activeMatchId = matchId;

    // Actualizar clase activa en la lista lateral
    document.querySelectorAll('.conversation-item').forEach(el => {
      el.classList.toggle('active', el.dataset.matchId === matchId);
    });

    // Mostrar viewport de chat
    chatEmptyState.classList.add('hidden');
    activeChatBox.classList.remove('hidden');

    // Modo móvil: abrir pantalla completa
    chatViewport.classList.add('mobile-open');

    // Llenar header
    chatHeaderName.textContent = otherUser.name;
    const avatarUrl = (otherUser.photos && otherUser.photos[0]) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';
    chatHeaderAvatar.src = avatarUrl;

    // Cargar mensajes
    await loadMessages(matchId);

    // Iniciar polling para mensajes en vivo
    if (chatPollInterval) clearInterval(chatPollInterval);
    chatPollInterval = setInterval(() => {
      if (activeMatchId === matchId) {
        loadMessages(matchId, true);
      }
    }, 2500);

    chatInput.focus();
  }

  async function loadMessages(matchId, silent = false) {
    try {
      const messages = await API.getMessages(matchId);
      
      const previousCount = chatMessagesBody.children.length;
      chatMessagesBody.innerHTML = '';

      if (messages.length === 0) {
        chatMessagesBody.innerHTML = `
          <div style="text-align: center; color: #94a3b8; font-size: 0.85rem; padding: 2rem;">
            <i class="fa-solid fa-sparkles" style="color: #fd297b; margin-bottom: 0.5rem; display: block; font-size: 1.5rem;"></i>
            ¡Es momento de romper el hielo! Escríbele algo divertido.
          </div>
        `;
      } else {
        messages.forEach(msg => {
          const isMine = msg.sender_id === currentUser.id;
          const bubble = document.createElement('div');
          bubble.className = `chat-bubble ${isMine ? 'mine' : 'theirs'}`;
          bubble.innerHTML = `
            <span>${escapeHtml(msg.text)}</span>
            <span class="chat-msg-time">${formatTime(msg.created_at)}</span>
          `;
          chatMessagesBody.appendChild(bubble);
        });

        // Scroll al fondo si hay mensajes nuevos
        if (!silent || messages.length !== previousCount) {
          chatMessagesBody.scrollTop = chatMessagesBody.scrollHeight;
        }
      }
    } catch (err) {
      console.error('Error al cargar mensajes:', err);
    }
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text || !activeMatchId) return;

    chatInput.value = '';

    // Añadir optimista en la UI
    const tempBubble = document.createElement('div');
    tempBubble.className = 'chat-bubble mine';
    tempBubble.innerHTML = `
      <span>${escapeHtml(text)}</span>
      <span class="chat-msg-time">Ahora</span>
    `;
    chatMessagesBody.appendChild(tempBubble);
    chatMessagesBody.scrollTop = chatMessagesBody.scrollHeight;

    try {
      await API.sendMessage(activeMatchId, text);
      // Recargar lista de conversaciones para actualizar el preview del último mensaje
      loadMatchesList();
      // Recargar mensajes tras respuesta automática potencial
      setTimeout(() => loadMessages(activeMatchId, true), 1600);
    } catch (err) {
      showToast('Error al enviar mensaje: ' + err.message, 'error');
    }
  }

  // ========================================================
  // EXPLORAR GRID DE PERFILES
  // ========================================================
  async function loadExploreGrid() {
    const grid = document.getElementById('explore-grid');
    grid.innerHTML = '<p style="color: #94a3b8;">Cargando perfiles...</p>';

    try {
      const profiles = await API.getDiscoverProfiles('todos');
      renderExploreGrid(profiles);
    } catch (err) {
      grid.innerHTML = `<p style="color: #ef4444;">Error: ${err.message}</p>`;
    }
  }

  function renderExploreGrid(profiles) {
    const grid = document.getElementById('explore-grid');
    grid.innerHTML = '';

    if (!profiles || profiles.length === 0) {
      grid.innerHTML = '<p style="color: #94a3b8; grid-column: 1/-1;">No hay perfiles disponibles por el momento.</p>';
      return;
    }

    profiles.forEach(p => {
      const card = document.createElement('div');
      card.className = 'explore-card';
      const photo = (p.photos && p.photos[0]) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';

      card.innerHTML = `
        <img src="${escapeHtml(photo)}" alt="${escapeHtml(p.name)}" loading="lazy">
        <div class="explore-card-info">
          <h4>${escapeHtml(p.name)}, ${p.age}</h4>
          <p><i class="fa-solid fa-location-dot"></i> ${escapeHtml(p.city || 'Ciudad de México')}</p>
          <p style="font-size: 0.75rem; color: #a29bfe; margin-top: 0.2rem;">${escapeHtml(p.occupation || '')}</p>
        </div>
      `;

      card.addEventListener('click', () => openDetailModal(p));
      grid.appendChild(card);
    });
  }

  // Modal de Detalle de Perfil
  function openDetailModal(profile) {
    const photo = (profile.photos && profile.photos[0]) || '';
    const tags = (profile.interests || [])
      .map(t => `<span class="tag-pill" style="background: rgba(255,255,255,0.2);">${escapeHtml(t)}</span>`)
      .join('');

    detailModalContent.innerHTML = `
      <div style="position: relative; height: 350px;">
        <img src="${escapeHtml(photo)}" alt="${escapeHtml(profile.name)}" style="width: 100%; height: 100%; object-fit: cover;">
      </div>
      <div style="padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem;">
        <div style="display: flex; align-items: baseline; gap: 0.5rem;">
          <h2 style="font-size: 1.7rem; font-weight: 800;">${escapeHtml(profile.name)}</h2>
          <span style="font-size: 1.4rem; color: #94a3b8;">${profile.age}</span>
        </div>
        
        <p style="color: #38bdf8; font-size: 0.9rem;"><i class="fa-solid fa-briefcase"></i> ${escapeHtml(profile.occupation || 'Sin ocupación especificada')}</p>
        <p style="color: #94a3b8; font-size: 0.9rem;"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(profile.city || 'Ciudad de México')}</p>
        
        <hr style="border-color: rgba(255,255,255,0.08); margin: 0.5rem 0;">
        
        <h4 style="font-size: 0.9rem; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px;">Sobre mí</h4>
        <p style="line-height: 1.5; color: #f8fafc;">${escapeHtml(profile.bio || 'Este usuario aún no ha escrito su biografía.')}</p>

        <h4 style="font-size: 0.9rem; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; margin-top: 0.5rem;">Intereses</h4>
        <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">${tags}</div>

        <div style="display: flex; gap: 0.75rem; margin-top: 1rem;">
          <button class="btn-primary" style="flex: 1;" id="btn-modal-like">
            <i class="fa-solid fa-heart"></i> Dar Like
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-modal-like').onclick = async () => {
      detailModal.classList.add('hidden');
      const res = await API.swipe(profile.id, 'like');
      if (res && res.isMatch) {
        showMatchCelebration(res.match);
      } else {
        showToast(`¡Le has dado like a ${profile.name}!`, 'success');
      }
      loadMatchesList();
    };

    detailModal.classList.remove('hidden');
  }

  // ========================================================
  // CAMBIAR CUENTA DEMO (SELECTOR SUPERIOR)
  // ========================================================
  async function setupDemoSelector() {
    const btnSelector = document.getElementById('btn-demo-selector');
    const dropdown = document.getElementById('demo-dropdown');
    const list = document.getElementById('demo-users-list');

    btnSelector.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      dropdown.classList.remove('show');
    });

    try {
      const demoUsers = await API.getDemoUsers();
      list.innerHTML = '';

      demoUsers.forEach(u => {
        const item = document.createElement('div');
        item.className = `demo-user-item ${currentUser && currentUser.id === u.id ? 'active' : ''}`;
        item.innerHTML = `
          <img src="${escapeHtml(u.avatar)}" alt="${escapeHtml(u.name)}" class="demo-user-avatar">
          <div class="demo-user-meta">
            <strong>${escapeHtml(u.name)}</strong>
            <span>${escapeHtml(u.occupation || u.email)}</span>
          </div>
        `;

        item.addEventListener('click', async () => {
          dropdown.classList.remove('show');
          try {
            await API.login(u.email, 'password123');
            currentUser = await API.getMe();
            updateUserUI();
            showToast(`Cambiado a ${u.name}`, 'success');
            await loadDiscoverCards();
            await loadMatchesList();
            setupDemoSelector(); // actualizar active
          } catch (err) {
            showToast('Error al cambiar de cuenta: ' + err.message, 'error');
          }
        });

        list.appendChild(item);
      });
    } catch (e) {
      console.warn('No se pudieron cargar usuarios demo:', e);
    }
  }

  // ========================================================
  // FORMULARIO PERFIL & GUARDADO
  // ========================================================
  const editProfileForm = document.getElementById('edit-profile-form');
  editProfileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('edit-name').value.trim();
    const age = document.getElementById('edit-age').value;
    const gender = document.getElementById('edit-gender').value;
    const interested_in = document.getElementById('edit-interested-in').value;
    const city = document.getElementById('edit-city').value.trim();
    const occupation = document.getElementById('edit-occupation').value.trim();
    const photoUrl = document.getElementById('edit-photo-url').value.trim();
    const bio = document.getElementById('edit-bio').value.trim();
    const rawInterests = document.getElementById('edit-interests').value;

    const interests = rawInterests
      ? rawInterests.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const photos = photoUrl ? [photoUrl] : (currentUser.photos || []);

    try {
      currentUser = await API.updateProfile({
        name,
        age,
        gender,
        interested_in,
        city,
        occupation,
        photos,
        bio,
        interests
      });

      updateUserUI();
      showToast('¡Perfil actualizado con éxito!', 'success');
    } catch (err) {
      showToast('Error al guardar perfil: ' + err.message, 'error');
    }
  });

  // Cerrar Sesión
  document.getElementById('btn-logout').addEventListener('click', () => {
    API.logout();
    currentUser = null;
    openAuthModal();
    showToast('Sesión cerrada.', 'info');
  });

  // ========================================================
  // EVENT LISTENERS & CONTROLES
  // ========================================================
  function setupEventListeners() {
    // Botones de swipe manual
    document.getElementById('btn-pass').addEventListener('click', () => swipeController.swipeManual('pass'));
    document.getElementById('btn-like').addEventListener('click', () => swipeController.swipeManual('like'));
    document.getElementById('btn-superlike').addEventListener('click', () => swipeController.swipeManual('superlike'));
    document.getElementById('btn-rewind').addEventListener('click', handleResetSwipes);

    // Botón ver detalle de la tarjeta superior
    document.getElementById('btn-show-detail').addEventListener('click', () => {
      const topCard = cardStack.lastElementChild;
      if (topCard && topCard.__profileData) {
        openDetailModal(topCard.__profileData);
      }
    });

    // Cerrar modales
    document.getElementById('btn-close-detail').addEventListener('click', () => {
      detailModal.classList.add('hidden');
    });

    detailModal.addEventListener('click', (e) => {
      if (e.target === detailModal) detailModal.classList.add('hidden');
    });

    // Filtros de género
    document.querySelectorAll('.filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentGenderFilter = btn.dataset.gender;
        loadDiscoverCards();
      });
    });

    // Búsqueda en Explorar
    const searchInput = document.getElementById('explore-search-input');
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      document.querySelectorAll('.explore-card').forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(term) ? 'block' : 'none';
      });
    });

    // Envío de chat
    chatForm.addEventListener('submit', handleSendMessage);

    // Emojis rápidos
    document.querySelectorAll('.quick-emoji-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        chatInput.value += btn.dataset.emoji;
        chatInput.focus();
      });
    });

    // Volver a matches en móvil
    btnBackToMatches.addEventListener('click', () => {
      chatViewport.classList.remove('mobile-open');
      if (chatPollInterval) clearInterval(chatPollInterval);
    });

    // Brand clic
    document.getElementById('btn-brand').addEventListener('click', () => {
      switchView('view-discover');
    });

    // Clic en avatar de cabecera abre perfil
    document.getElementById('btn-header-user').addEventListener('click', () => {
      if (currentUser) {
        switchView('view-profile');
      } else {
        openAuthModal();
      }
    });
  }

  // ========================================================
  // NAVEGACIÓN ENTRE VISTAS
  // ========================================================
  function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const viewId = item.dataset.view;
        switchView(viewId);
      });
    });
  }

  function switchView(viewId) {
    document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active-view'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const targetView = document.getElementById(viewId);
    if (targetView) {
      targetView.classList.add('active-view');
    }

    const targetNav = document.querySelector(`.nav-item[data-view="${viewId}"]`);
    if (targetNav) {
      targetNav.classList.add('active');
    }

    // Acciones al cambiar de vista
    if (viewId === 'view-matches') {
      loadMatchesList();
    } else if (viewId === 'view-explore') {
      loadExploreGrid();
    } else if (viewId === 'view-discover') {
      // Si el stack está vacío, reintentar cargar
      if (cardStack.children.length === 0) {
        loadDiscoverCards();
      }
    }
  }

  // ========================================================
  // MODAL DE AUTENTICACIÓN
  // ========================================================
  function openAuthModal() {
    document.body.classList.add('auth-open');
    authModal.classList.remove('hidden');
  }

  function closeAuthModal() {
    authModal.classList.add('hidden');
    document.body.classList.remove('auth-open');
  }

  // Pestañas Login / Registro
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');

  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    formLogin.classList.add('active-form');
    formRegister.classList.remove('active-form');
  });

  tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    formRegister.classList.add('active-form');
    formLogin.classList.remove('active-form');
  });

  document.getElementById('btn-close-auth').addEventListener('click', closeAuthModal);

  authModal.addEventListener('click', (e) => {
    if (e.target === authModal) closeAuthModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !authModal.classList.contains('hidden')) {
      closeAuthModal();
    }
  });

  // Login Submit
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    try {
      const res = await API.login(email, password);
      currentUser = res.user;
      updateUserUI();
      closeAuthModal();
      showToast(`¡Bienvenido/a de nuevo, ${currentUser.name}!`, 'success');
      await loadDiscoverCards();
      await loadMatchesList();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Botón Demo Login Rápido
  document.getElementById('btn-quick-demo-login').addEventListener('click', async () => {
    try {
      const res = await API.login('demo@citasya.com', 'password123');
      currentUser = res.user;
      updateUserUI();
      closeAuthModal();
      showToast(`¡Entraste como ${currentUser.name}!`, 'success');
      await loadDiscoverCards();
      await loadMatchesList();
    } catch (err) {
      showToast('Error al iniciar como demo: ' + err.message, 'error');
    }
  });

  // Registro Submit
  formRegister.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const age = document.getElementById('reg-age').value;
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const passwordConfirm = document.getElementById('reg-password-confirm').value;
    const gender = document.getElementById('reg-gender').value;
    const interested_in = document.getElementById('reg-interested-in').value;

    if (password !== passwordConfirm) {
      showToast('Las contraseñas no coinciden.', 'error');
      document.getElementById('reg-password-confirm').focus();
      return;
    }

    try {
      const res = await API.register({
        name,
        age,
        email,
        password,
        gender,
        interested_in
      });

      currentUser = res.user;
      updateUserUI();
      closeAuthModal();
      showToast(`¡Cuenta creada exitosamente! Bienvenido/a, ${name}`, 'success');
      await loadDiscoverCards();
      await loadMatchesList();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // ========================================================
  // UTILIDADES: TOASTS, FECHAS & ESCAPADO
  // ========================================================
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-circle-check' : (type === 'error' ? 'fa-circle-xmark' : 'fa-info-circle');
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHtml(message)}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function formatTime(isoString) {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Iniciar la Aplicación
  await initApp();
});

