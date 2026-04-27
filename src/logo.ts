export function initLogoAnimation(): void {
  const headerLogo = document.querySelector<HTMLElement>('.header .headline-icon');
  if (headerLogo) headerLogo.classList.add('animate-logo');

  const footerLogo = document.querySelector<HTMLElement>('.footer .headline-icon');
  if (!footerLogo) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          el.classList.remove('animate-logo');
          requestAnimationFrame(() => {
            requestAnimationFrame(() => { el.classList.add('animate-logo'); });
          });
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.5 }
  );
  observer.observe(footerLogo);
}
