
export function createBentoGrid() {
  const grid = document.createElement('div');
  grid.className = 'grid-bento';
  return grid;
}

export function createCard(title, value, subtitle, size = 'small') {
  const card = document.createElement('div');
  card.className = 'card';

  // Responsive grid spanning
  if (size === 'medium') card.style.gridColumn = 'span 6';
  else if (size === 'large') card.style.gridColumn = 'span 12';
  else card.style.gridColumn = 'span 3';

  card.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
      <h3 class="text-xs" style="text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-secondary); font-weight: 600;">${title}</h3>
      <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-text-primary); letter-spacing: -0.01em;">${value}</div>
      ${subtitle ? `<div class="text-xs text-muted" style="font-weight: 500;">${subtitle}</div>` : ''}
    </div>
  `;

  return card;
}
