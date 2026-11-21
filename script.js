// Controle Interativo do Feed Reels / TikTok com suporte a 2x Speed e YouTube Player API
document.addEventListener('DOMContentLoaded', () => {
  const feed = document.getElementById('reelsFeed');
  const cards = document.querySelectorAll('.reel-card');
  const filterChips = document.querySelectorAll('.reel-chip');
  const backToTopBtn = document.getElementById('backToTopBtn');

  // 0. Modal de Aviso / Onboarding ("Sem julgamentos 🫡")
  const welcomeModal = document.getElementById('welcomeModal');
  const startReelsBtn = document.getElementById('startReelsBtn');
  const onboardingToast = document.getElementById('feedOnboardingToast');
  let hasShownScrollToast = false;

  if (startReelsBtn && welcomeModal) {
    startReelsBtn.addEventListener('click', () => {
      welcomeModal.classList.add('closed');
      const firstCard = cards[0];
      if (firstCard) {
        const playBtn = firstCard.querySelector('.play-indicator');
        if (playBtn) playBtn.click();
      }
    });
  }

  // Dispara o onboarding do 2X no primeiro scroll do feed
  if (feed && onboardingToast) {
    feed.addEventListener('scroll', () => {
      if (!hasShownScrollToast && feed.scrollTop > 40) {
        hasShownScrollToast = true;
        onboardingToast.classList.add('show');
        setTimeout(() => {
          onboardingToast.classList.remove('show');
        }, 4000);
      }
    }, { passive: true });
  }

  // Mapa de instâncias dos players do YouTube
  const players = {};

  // 1. Alternador de Filtro rápido no Topo
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const filter = chip.getAttribute('data-filter');

      cards.forEach(card => {
        const cat = card.getAttribute('data-category');
        if (filter === 'all' || cat === filter || card.classList.contains('reel-end-card')) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });

      const firstVisible = Array.from(cards).find(c => c.style.display !== 'none');
      if (firstVisible) {
        firstVisible.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // 2. Botão Voltar ao Topo
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      feed.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // 3. Sistema de Play/Pause e Controle de Velocidade 2x ao Segurar
  cards.forEach((card, index) => {
    const videoId = card.getAttribute('data-video-id');
    const container = card.querySelector('.reel-video-container');
    const playIndicator = card.querySelector('.play-indicator');
    const soundBtn = card.querySelector('.sound-btn');

    if (!videoId || !container) return;

    const playerId = `yt-player-${index}`;
    let holdTimer = null;
    let isSpeeding = false;

    // Toast de Velocidade 2x
    const speedBadge = document.createElement('div');
    speedBadge.className = 'speed-badge';
    speedBadge.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>
      <span>2X Velocidade</span>
    `;
    card.appendChild(speedBadge);

    // Zonas de toque lateral para segurar (estilo TikTok)
    const leftZone = document.createElement('div');
    leftZone.className = 'speed-zone speed-zone-left';
    const rightZone = document.createElement('div');
    rightZone.className = 'speed-zone speed-zone-right';
    card.appendChild(leftZone);
    card.appendChild(rightZone);

    const playVideo = () => {
      if (card.classList.contains('playing')) return;

      container.innerHTML = `<div id="${playerId}"></div>`;

      // Inicializa via YouTube IFrame API para controle total de playbackRate
      if (window.YT && window.YT.Player) {
        players[playerId] = new window.YT.Player(playerId, {
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3
          },
          events: {
            onReady: (event) => {
              event.target.playVideo();
            }
          }
        });
      } else {
        // Fallback para iframe padrão
        container.innerHTML = `
          <iframe 
            id="${playerId}"
            class="game-video"
            src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&controls=0&rel=0&modestbranding=1&playsinline=1&disablekb=1&fs=0&iv_load_policy=3&enablejsapi=1" 
            title="Trailer" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
          </iframe>
        `;
      }
      card.classList.add('playing');
    };

    if (playIndicator) {
      playIndicator.addEventListener('click', playVideo);
    }
    if (soundBtn) {
      soundBtn.addEventListener('click', playVideo);
    }

    // Função para alterar velocidade
    const setPlaybackRate = (rate) => {
      const player = players[playerId];
      if (player && typeof player.setPlaybackRate === 'function') {
        player.setPlaybackRate(rate);
      } else {
        // Envia mensagem postMessage para o iframe do YouTube
        const iframe = container.querySelector('iframe');
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage(JSON.stringify({
            event: 'command',
            func: 'setPlaybackRate',
            args: [rate]
          }), '*');
        }
      }
    };

    // Eventos de Pressionar e Segurar (Touch & Mouse)
    const startHold = () => {
      if (!card.classList.contains('playing')) return;
      holdTimer = setTimeout(() => {
        isSpeeding = true;
        setPlaybackRate(2);
        speedBadge.classList.add('active');
        if (navigator.vibrate) navigator.vibrate(40);
      }, 250);
    };

    const endHold = () => {
      clearTimeout(holdTimer);
      if (isSpeeding) {
        isSpeeding = false;
        setPlaybackRate(1);
        speedBadge.classList.remove('active');
      }
    };

    [leftZone, rightZone].forEach(zone => {
      zone.addEventListener('mousedown', startHold);
      zone.addEventListener('mouseup', endHold);
      zone.addEventListener('mouseleave', endHold);
      zone.addEventListener('touchstart', startHold, { passive: true });
      zone.addEventListener('touchend', endHold);
      zone.addEventListener('touchcancel', endHold);
    });
  });

  // 4. Botão de Curtir com feedback visual estilo TikTok
  document.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      btn.classList.toggle('liked');
      const countEl = btn.querySelector('.action-count');
      if (countEl) {
        const isLiked = btn.classList.contains('liked');
        const base = parseFloat(countEl.textContent) || 9.8;
        countEl.textContent = isLiked ? (base + 0.1).toFixed(1) + 'k' : (base - 0.1).toFixed(1) + 'k';
      }
    });
  });

  // 5. Auto Pause / Fechar ao mudar de Reel (IntersectionObserver)
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const card = entry.target;
      // Quando o card sai da tela (menos de 50% visível)
      if (!entry.isIntersecting || entry.intersectionRatio < 0.5) {
        if (card.classList.contains('playing')) {
          const container = card.querySelector('.reel-video-container');
          const iframe = container ? container.querySelector('iframe') : null;
          
          // Pausa o vídeo via postMessage
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage(JSON.stringify({
              event: 'command',
              func: 'pauseVideo',
              args: []
            }), '*');
          }

          // Se preferir fechar o iframe completamente para economizar memória e bateria:
          const playerId = container && container.firstElementChild ? container.firstElementChild.id : null;
          if (playerId && players[playerId] && typeof players[playerId].pauseVideo === 'function') {
            players[playerId].pauseVideo();
          }
        }
      }
    });
  }, {
    root: feed,
    threshold: [0.2, 0.5, 0.8]
  });

  cards.forEach(card => observer.observe(card));
});
