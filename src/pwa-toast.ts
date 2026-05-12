export function showUpdateToast(): void {
  if (document.getElementById('pwa-toast')) return;

  const toast = document.createElement('div');
  toast.id = 'pwa-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.innerHTML = `
    <span class="pwa-toast-msg">App updated — reload for the latest version.</span>
    <button class="pwa-toast-reload" type="button">Reload</button>
    <button class="pwa-toast-close" type="button" aria-label="Dismiss">✕</button>
  `;

  toast.querySelector('.pwa-toast-reload')?.addEventListener('click', () => {
    window.location.reload();
  });
  toast.querySelector('.pwa-toast-close')?.addEventListener('click', () => {
    toast.remove();
  });

  document.body.appendChild(toast);
}

export function initPwaUpdateToast(): void {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('controllerchange', showUpdateToast);
}
