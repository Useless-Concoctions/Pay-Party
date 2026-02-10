
import { DB } from '../data/db.js';

export function renderLogin(element, onLogin) {
  element.innerHTML = `
    <div style="
      height: 100vh;
      width: 100vw;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-bg);
      background-image: radial-gradient(at 50% 0%, rgba(79, 70, 229, 0.05) 0px, transparent 50%);
    ">
      <div class="card" style="width: 100%; max-width: 420px; padding: 2.5rem;">
        <div style="margin-bottom: 2rem; text-align: center;">
          <h1 style="font-size: 1.5rem; margin-bottom: 0.5rem;">Pay Party 🎉</h1>
          <p class="text-secondary text-sm">Enter your email to get a login link.</p>
        </div>

        <form id="login-form" style="display: flex; flex-direction: column; gap: 1.25rem;">
          <div>
            <label class="text-sm" style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: var(--color-text-secondary);">Email</label>
            <input type="email" id="email-input" placeholder="you@example.com" required autofocus
              style="font-size: 1rem; padding: 0.75rem;" />
          </div>
          <button type="submit" class="btn-primary" style="width: 100%; justify-content: center; font-size: 1rem; padding: 0.75rem;">Send Magic Link</button>
          <div id="login-msg" class="text-xs text-center" style="min-height: 1.5em; font-weight: 500;"></div>
        </form>
      </div>
    </div>
  `;

  const form = element.querySelector('#login-form');
  const msg = element.querySelector('#login-msg');
  const emailInput = element.querySelector('#email-input');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value;

    try {
      msg.textContent = 'Sending Magic Link...';
      msg.style.color = 'var(--color-text-secondary)';
      emailInput.disabled = true;
      form.querySelector('button').disabled = true;

      await DB.login(email);

      msg.textContent = '✓ Check your email for the login link!';
      msg.style.color = 'var(--color-success)';
    } catch (err) {
      console.error(err);
      msg.textContent = err.message || 'Failed to send link';
      msg.style.color = 'var(--color-danger)';
      emailInput.disabled = false;
      form.querySelector('button').disabled = false;
    }
  });
}
