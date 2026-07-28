(function () {
    const canvas = document.getElementById('stars-canvas');
    const ctx = canvas.getContext('2d');
    let stars = [];

    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        generate();
    }

    function generate() {
        const count = Math.floor((canvas.width * canvas.height) / 3500);
        stars = Array.from({ length: count }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 1.1 + 0.15,
            base: Math.random() * 0.6 + 0.1,
            phase: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.008 + 0.003,
        }));
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        stars.forEach(s => {
            s.phase += s.speed;
            const a = s.base * (0.65 + 0.35 * Math.sin(s.phase));
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200, 215, 255, ${a})`;
            ctx.fill();
        });
        requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    resize();
    draw();
})();

document.addEventListener('DOMContentLoaded', function () {

    const isWindows = /Win/i.test(navigator.platform || navigator.userAgent);

    document.querySelectorAll('.app-chrome').forEach(el => {
        const title = el.dataset.title || '';
        if (isWindows) {
            el.classList.add('win');
            el.innerHTML = `
                <span class="chrome-title">${title}</span>
                <div class="win-buttons">
                    <button class="win-btn" aria-label="Minimize">
                        <svg width="10" height="1" viewBox="0 0 10 1"><rect width="10" height="1" fill="currentColor"/></svg>
                    </button>
                    <button class="win-btn" aria-label="Maximize">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><rect x="0.5" y="0.5" width="9" height="9" stroke="currentColor"/></svg>
                    </button>
                    <button class="win-btn close" aria-label="Close">
                        <svg width="10" height="10" viewBox="0 0 10 10"><line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" stroke-width="1.2"/><line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" stroke-width="1.2"/></svg>
                    </button>
                </div>`;
        } else {
            el.classList.add('mac');
            el.innerHTML = `
                <span class="mac-dot red"></span>
                <span class="mac-dot yellow"></span>
                <span class="mac-dot green"></span>
                <span class="chrome-title">${title}</span>`;
        }
    });

    document.querySelectorAll('.image-carousel').forEach(carousel => {
        const images = carousel.querySelectorAll('.carousel-image');
        const dotsContainer = carousel.closest('.project-media').querySelector('.carousel-controls');
        if (!dotsContainer || images.length <= 1) return;
        const dots = dotsContainer.querySelectorAll('.carousel-dot');
        let idx = 0;

        function show(n) {
            idx = (n + images.length) % images.length;
            images.forEach((img, i) => img.classList.toggle('active', i === idx));
            dots.forEach((dot, i) => dot.classList.toggle('active', i === idx));
        }

        dots.forEach((dot, i) => dot.addEventListener('click', () => show(i)));
        setInterval(() => show(idx + 1), 5000);
    });

    document.querySelectorAll('.nz-gallery').forEach(gallery => {
        const track = gallery.querySelector('.nz-gallery-track');
        const items = track.querySelectorAll('.nz-ss-box');
        const prevBtn = gallery.querySelector('.nz-gallery-arrow.prev');
        const nextBtn = gallery.querySelector('.nz-gallery-arrow.next');
        const dotsContainer = gallery.querySelector('.nz-gallery-dots');
        if (!items.length) return;

        dotsContainer.innerHTML = Array.from(items).map((_, i) =>
            `<button class="nz-gallery-dot${i === 0 ? ' active' : ''}" aria-label="Go to screenshot ${i + 1}"></button>`
        ).join('');
        const dots = dotsContainer.querySelectorAll('.nz-gallery-dot');

        function scrollToIndex(i) {
            const clamped = Math.max(0, Math.min(items.length - 1, i));
            items[clamped].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
        }

        function currentIndex() {
            const viewCenter = track.scrollLeft + track.clientWidth / 2;
            let closest = 0;
            let smallestDiff = Infinity;
            items.forEach((item, i) => {
                const itemCenter = item.offsetLeft + item.offsetWidth / 2;
                const diff = Math.abs(itemCenter - viewCenter);
                if (diff < smallestDiff) { smallestDiff = diff; closest = i; }
            });
            return closest;
        }

        let scrollTimeout;
        track.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const idx = currentIndex();
                dots.forEach((dot, i) => dot.classList.toggle('active', i === idx));
            }, 100);
        });

        prevBtn.addEventListener('click', () => scrollToIndex(currentIndex() - 1));
        nextBtn.addEventListener('click', () => scrollToIndex(currentIndex() + 1));
        dots.forEach((dot, i) => dot.addEventListener('click', () => scrollToIndex(i)));
    });

    const triggers = document.querySelectorAll('.lightbox-trigger');
    if (triggers.length) {
        const overlay = document.createElement('div');
        overlay.className = 'lightbox-overlay';
        overlay.innerHTML = `
            <button class="lightbox-close" aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="4" x2="20" y2="20"/><line x1="20" y1="4" x2="4" y2="20"/></svg>
            </button>
            <img src="" alt="">`;
        document.body.appendChild(overlay);
        const overlayImg = overlay.querySelector('img');

        function open(src, alt) {
            overlayImg.src = src;
            overlayImg.alt = alt;
            overlay.classList.add('active');
        }

        function close() {
            overlay.classList.remove('active');
        }

        triggers.forEach(img => {
            img.addEventListener('click', () => open(img.src, img.alt));
        });
        overlay.addEventListener('click', e => {
            if (e.target === overlay || e.target.closest('.lightbox-close')) close();
        });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') close();
        });
    }
});
