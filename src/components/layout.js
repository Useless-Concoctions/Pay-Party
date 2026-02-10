
import { createBentoGrid, createCard } from './ui.js';
import { createPaychequeForm } from './forms.js';
import { createTimeline } from './charts.js';
import { DB } from '../data/db.js';
import { detectEras } from '../data/models.js';

let viewMode = 'gross'; // 'gross' | 'net' | 'hourly'

export async function setupLayout(element) {
  element.innerHTML = `
    <div class="container">
      <header style="padding: 2rem 0; display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--color-border);">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <h1 style="font-size: 1.125rem; font-weight: 700;">Pay Party <span style="font-weight: 400; color: var(--color-text-muted);">🎉</span></h1>
        </div>
        
        <div style="display: flex; gap: 1rem; align-items: center;">
             <div class="toggle-group">
                <button id="toggle-gross" class="text-xs" style="border: none; padding: 0.375rem 0.75rem; border-radius: 4px; transition: var(--transition-normal);">Gross</button>
                <button id="toggle-net" class="text-xs" style="border: none; padding: 0.375rem 0.75rem; border-radius: 4px; transition: var(--transition-normal);">Net</button>
                <button id="toggle-hourly" class="text-xs" style="border: none; padding: 0.375rem 0.75rem; border-radius: 4px; transition: var(--transition-normal);">Rate</button>
             </div>
            <button id="logout-btn" class="text-xs" style="background: none; border: none; color: var(--color-text-muted); cursor: pointer; margin-left: 0.5rem;" title="Lock App">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
        </div>
      </header>
      <main id="dashboard-content">
        <!-- Dashboard populated by renderDashboard() -->
        <div style="padding: 2rem; text-align: center; color: var(--color-text-muted);">Loading data...</div>
      </main>
    </div>
  `;

  const updateToggleUI = () => {
    const modes = ['gross', 'net', 'hourly'];
    modes.forEach(mode => {
      const btn = document.getElementById(`toggle-${mode}`);
      if (btn) {
        if (viewMode === mode) {
          btn.style.background = '#ffffff';
          btn.style.color = 'var(--color-primary)';
          btn.style.boxShadow = 'var(--shadow-sm)';
          btn.style.fontWeight = '600';
        } else {
          btn.style.background = 'transparent';
          btn.style.color = 'var(--color-text-secondary)';
          btn.style.boxShadow = 'none';
          btn.style.fontWeight = '400';
        }
      }
    });
  };

  document.getElementById('toggle-gross').addEventListener('click', () => { viewMode = 'gross'; updateToggleUI(); renderDashboard(); });
  document.getElementById('toggle-net').addEventListener('click', () => { viewMode = 'net'; updateToggleUI(); renderDashboard(); });
  document.getElementById('toggle-hourly').addEventListener('click', () => { viewMode = 'hourly'; updateToggleUI(); renderDashboard(); });


  document.getElementById('logout-btn').addEventListener('click', async () => {
    await DB.logout();
    location.reload();
  });

  updateToggleUI();
  await renderDashboard();
}

async function renderDashboard() {
  const main = document.getElementById('dashboard-content');
  if (!main) return;

  // Show simple loading state if strictly needed, but might flicker
  // main.innerHTML = '<div style="padding: 2rem; text-align: center;">Loading...</div>';

  const data = await DB.getAll();
  main.innerHTML = ''; // Clear loading

  const eras = detectEras(data);
  const currentEra = eras[eras.length - 1];

  const grid = createBentoGrid();

  // 1. Stats Row
  if (data.length > 0) {
    const isGross = viewMode === 'gross';
    const isNet = viewMode === 'net';
    const totalValue = data.reduce((acc, curr) => acc + (isGross ? curr.gross : (curr.net || 0)), 0);

    grid.appendChild(createCard(
      isGross ? 'Total Billing' : 'Net Earnings',
      `$${totalValue.toLocaleString()}`,
      'Lifetime tracking'
    ));

    if (currentEra) {
      const rateValue = isGross ? currentEra.endPay : currentEra.endNet;
      // Handle missing endPay for partial eras
      const displayRate = rateValue ? rateValue.toLocaleString() : '0';

      grid.appendChild(createCard(
        isGross ? 'Current Gross' : 'Current Net',
        `$${displayRate}`,
        currentEra.company
      ));

      grid.appendChild(createCard(
        'Tenure',
        `${currentEra.tenureDays || 0} Days`,
        `Since ${currentEra.startDate}`
      ));

      const eraHours = currentEra.paycheques.reduce((acc, p) => acc + (p.hours || 0) + (p.otHours || 0), 0);
      const eraTotalPay = currentEra.paycheques.reduce((acc, p) => acc + (isGross ? p.gross : (p.net || 0)), 0);

      if (eraHours > 0) {
        const hourlyRate = eraTotalPay / eraHours;
        grid.appendChild(createCard(
          'Avg Hourly',
          `$${hourlyRate.toFixed(2)}/hr`,
          `${eraHours}h logged`
        ));
      } else {
        grid.appendChild(createCard('Avg Hourly', 'N/A', 'Add hours to track'));
      }
    }
  } else {
    grid.appendChild(createCard('Total Billing', '$0.00', 'No data'));
    grid.appendChild(createCard('Status', 'Idle', 'No active job'));
    grid.appendChild(createCard('Tenure', '-', 'N/A'));
    grid.appendChild(createCard('Hourly Rate', '-', 'N/A'));
  }

  // 2. Add Form
  grid.appendChild(createPaychequeForm(() => renderDashboard()));

  // 3. Timeline
  if (data.length > 0) {
    grid.appendChild(createTimeline(data, viewMode));
  }

  main.appendChild(grid);
}
