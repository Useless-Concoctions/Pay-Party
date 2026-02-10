
import './style.css';
import { setupLayout } from './components/layout.js';
import { renderLogin } from './components/auth.js';
import { DB } from './data/db.js';

const app = document.querySelector('#app');

async function init() {
  // Check if returning from a magic link
  await DB.completeSignIn();

  // Check for active Firebase session
  const user = await DB.getSession();

  if (user) {
    app.innerHTML = '<div id="layout-root"></div>';
    await setupLayout(document.querySelector('#layout-root'));
  } else {
    app.innerHTML = '';
    const loginContainer = document.createElement('div');
    app.appendChild(loginContainer);
    renderLogin(loginContainer);
  }
}

init();
