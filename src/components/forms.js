
import { DB } from '../data/db.js';
import { extractDataFromPDF } from '../utils/pdf-parser.js';

export function createPaychequeForm(onSubmit) {
  const formCard = document.createElement('div');
  formCard.className = 'card';
  formCard.style.gridColumn = 'span 12';

  formCard.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem;">
      <div>
        <h2 style="font-size: 1.125rem; margin-bottom: 0.125rem;">Add Paycheque</h2>
        <p class="text-secondary text-sm">Enter details manually or upload a PDF for auto-extraction.</p>
      </div>
      <span class="badge">Auto-Parser Active</span>
    </div>
    
    <div style="display: grid; grid-template-columns: 280px 1fr; gap: 3rem;">
      <!-- PDF Drop Zone -->
      <div id="drop-zone" style="border: 2px dashed var(--color-border); border-radius: var(--radius-md); padding: 1.5rem; text-align: center; transition: var(--transition-normal); cursor: pointer; background: #f8fafc; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 0.75rem;">
          <div style="width: 40px; height: 40px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid var(--color-border);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </div>
          <div>
            <p style="font-weight: 500; font-size: 0.875rem; color: var(--color-text-primary); margin-bottom: 0.125rem;">Drop paystub here</p>
            <p class="text-muted" style="font-size: 0.6875rem;">Support PDFs up to 10MB</p>
          </div>
          <input type="file" id="pdf-upload" accept="application/pdf" style="display: none;">
      </div>

      <!-- Verification / Edit Form -->
      <form id="add-pay-form" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem;">
        <div style="grid-column: span 2; display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
           <div class="form-group">
            <label class="text-xs text-secondary" style="display: block; margin-bottom: 0.375rem; font-weight: 600;">Date</label>
            <input type="date" name="date" required>
          </div>
          <div class="form-group">
            <label class="text-xs text-secondary" style="display: block; margin-bottom: 0.375rem; font-weight: 600;">Hours tracked</label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
              <input type="number" name="hours" placeholder="Regular">
              <input type="number" name="otHours" placeholder="OT">
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="text-xs text-secondary" style="display: block; margin-bottom: 0.375rem; font-weight: 600;">Gross Amount</label>
          <input type="number" name="gross" placeholder="0.00" required step="0.01">
        </div>
        <div class="form-group">
          <label class="text-xs text-secondary" style="display: block; margin-bottom: 0.375rem; font-weight: 600;">Net Amount</label>
          <input type="number" name="net" placeholder="0.00" required step="0.01">
        </div>
        <div class="form-group">
          <label class="text-xs text-secondary" style="display: block; margin-bottom: 0.375rem; font-weight: 600;">Company</label>
          <input type="text" name="company" placeholder="Organization name" required>
        </div>
        <div class="form-group">
          <label class="text-xs text-secondary" style="display: block; margin-bottom: 0.375rem; font-weight: 600;">Role</label>
          <input type="text" name="role" placeholder="Position title" required>
        </div>

        <div style="grid-column: span 2; padding-top: 0.5rem;">
          <button type="submit" class="btn-primary" style="width: 100%;">Add Record</button>
        </div>
      </form>
    </div>
  `;

  // Drop Zone Logic
  const dropZone = formCard.querySelector('#drop-zone');
  const fileInput = formCard.querySelector('#pdf-upload');

  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--color-primary)';
    dropZone.style.background = '#f1f5f9';
  });

  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--color-border)';
    dropZone.style.background = '#f8fafc';
  });

  dropZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--color-border)';
    dropZone.style.background = '#f8fafc';

    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      handleFile(file);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) handleFile(e.target.files[0]);
  });

  async function handleFile(file) {
    const originalContent = dropZone.innerHTML;
    dropZone.innerHTML = `
      <div class="spinner" style="width: 20px; height: 20px; border: 2px solid #e2e8f0; border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 0.5rem;"></div>
      <p style="color: var(--color-primary); font-size: 0.8125rem;">Processing...</p>
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `;

    try {
      const data = await extractDataFromPDF(file);
      // Autofill form
      const dateInput = formCard.querySelector('input[name="date"]');
      const grossInput = formCard.querySelector('input[name="gross"]');
      const netInput = formCard.querySelector('input[name="net"]');
      const hoursInput = formCard.querySelector('input[name="hours"]');

      if (data.date) dateInput.value = data.date;
      if (data.gross) grossInput.value = data.gross;
      if (data.net) netInput.value = data.net;
      if (data.hours) hoursInput.value = data.hours;

      dropZone.innerHTML = `
        <div style="width: 40px; height: 40px; background: #ecfdf5; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid #10b981;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <p style="color: var(--color-success); font-weight: 500; font-size: 0.8125rem;">Done</p>
      `;

      setTimeout(() => {
        dropZone.innerHTML = originalContent;
        const newFileInput = formCard.querySelector('#pdf-upload');
        newFileInput.addEventListener('change', (e) => {
          if (e.target.files[0]) handleFile(e.target.files[0]);
        });
      }, 3000);

    } catch (err) {
      console.error(err);
      dropZone.innerHTML = `
        <div style="width: 40px; height: 40px; background: #fef2f2; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid #ef4444;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <p style="color: var(--color-danger); font-weight: 500; font-size: 0.8125rem;">Error</p>
      `;
      setTimeout(() => {
        dropZone.innerHTML = originalContent;
        const newFileInput = formCard.querySelector('#pdf-upload');
        newFileInput.addEventListener('change', (e) => {
          if (e.target.files[0]) handleFile(e.target.files[0]);
        });
      }, 3000);
    }
  }

  formCard.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Saving...';
    btn.disabled = true;

    const formData = new FormData(e.target);
    const data = {
      date: formData.get('date'),
      gross: parseFloat(formData.get('gross')),
      net: parseFloat(formData.get('net')),
      hours: parseFloat(formData.get('hours')) || 0,
      otHours: parseFloat(formData.get('otHours')) || 0,
      company: formData.get('company'),
      role: formData.get('role'),
    };

    try {
      await DB.add(data);
      e.target.reset();
      if (onSubmit) onSubmit();
    } catch (err) {
      alert('Error saving data: ' + err.message);
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });

  return formCard;
}
