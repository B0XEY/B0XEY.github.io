(function () {
    const canvas = document.getElementById('stars-canvas');
    const ctx = canvas.getContext('2d');
    let stars = [];
    let shootingStars = [];
    let parallaxOffset = 0;
    let parallaxBuffer = 0;

    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        parallaxBuffer = canvas.height * 0.15;
        generate();
    }

    function generate() {
        const fieldHeight = canvas.height + parallaxBuffer * 2;
        const count = Math.floor((canvas.width * fieldHeight) / 3500);
        stars = Array.from({ length: count }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * fieldHeight - parallaxBuffer,
            r: Math.random() * 1.1 + 0.15,
            base: Math.random() * 0.6 + 0.1,
            phase: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.008 + 0.003,
        }));
    }

    function spawnShootingStar() {
        const fromLeft = Math.random() < 0.5;
        const dir = fromLeft ? 1 : -1;
        const angle = (Math.random() * 20 + 25) * (Math.PI / 180);
        const speed = Math.random() * 6 + 9;
        shootingStars.push({
            x: fromLeft ? Math.random() * canvas.width * 0.4 : canvas.width - Math.random() * canvas.width * 0.4,
            y: Math.random() * canvas.height * 0.8 - 30,
            vx: Math.cos(angle) * speed * dir,
            vy: Math.sin(angle) * speed,
            len: Math.random() * 70 + 60,
            life: 1,
        });
    }

    function scheduleShootingStar() {
        const delay = Math.random() * 3500 + 1500;
        setTimeout(() => {
            spawnShootingStar();
            scheduleShootingStar();
        }, delay);
    }

    function drawShootingStars() {
        shootingStars.forEach(s => {
            s.x += s.vx;
            s.y += s.vy;
            s.life -= 0.012;
        });
        shootingStars = shootingStars.filter(s =>
            s.life > 0 && s.y < canvas.height + 50 && s.x > -50 && s.x < canvas.width + 50
        );

        shootingStars.forEach(s => {
            const alpha = s.life * 0.5;
            const mag = Math.hypot(s.vx, s.vy) || 1;
            const tailX = s.x - (s.vx / mag) * s.len;
            const tailY = s.y - (s.vy / mag) * s.len;

            const gradient = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
            gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.beginPath();
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1.2;
            ctx.lineCap = 'round';
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(tailX, tailY);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(s.x, s.y, 1.1, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fill();
        });
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(0, parallaxOffset);
        stars.forEach(s => {
            s.phase += s.speed;
            const a = s.base * (0.65 + 0.35 * Math.sin(s.phase));
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200, 215, 255, ${a})`;
            ctx.fill();
        });
        drawShootingStars();
        ctx.restore();
        requestAnimationFrame(draw);
    }

    let ticking = false;
    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            parallaxOffset = Math.max(-parallaxBuffer, Math.min(parallaxBuffer, window.scrollY * -0.06));
            ticking = false;
        });
    }

    window.addEventListener('resize', resize);
    window.addEventListener('scroll', onScroll, { passive: true });
    resize();
    draw();
    scheduleShootingStar();
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
