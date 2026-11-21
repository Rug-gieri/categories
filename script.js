// Interatividade dos Chips de Filtro
document.addEventListener('DOMContentLoaded', () => {
  const filterChips = document.querySelectorAll('.nav-chip');
  const cards = document.querySelectorAll('.game-card');
  const dividers = document.querySelectorAll('.category-divider');

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      // Atualizar classe ativa do chip
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const target = chip.getAttribute('data-target');

      // Exibir / ocultar divisores
      dividers.forEach(div => {
        if (target === 'all' || div.getAttribute('data-game') === target) {
          div.style.display = 'flex';
        } else {
          div.style.display = 'none';
        }
      });

      cards.forEach(card => {
        if (target === 'all' || card.getAttribute('data-game') === target) {
          card.style.display = '';
          // Animação suave ao reaparecer
          card.style.opacity = '0';
          card.style.transform = 'translateY(8px)';
          setTimeout(() => {
            card.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 30);
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Otimização de Performance: Carregamento do YouTube sob demanda (Facade)
  document.querySelectorAll('.video-facade').forEach(facade => {
    facade.addEventListener('click', () => {
      const videoId = facade.getAttribute('data-video-id');
      const title = facade.getAttribute('data-title') || 'Vídeo do YouTube';
      if (!videoId) return;

      const iframe = document.createElement('iframe');
      iframe.className = 'game-video';
      iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`;
      iframe.title = title;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;

      facade.replaceWith(iframe);
    });
  });
});
