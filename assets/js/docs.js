/*
 * Noizy documentation viewer.
 * Renders the markdown files in /docs at runtime under clean paths like
 * /noizy/docs/getting-started. Adding a page means dropping a .md file into
 * /docs and adding one line to NAV below.
 *
 * GitHub Pages has no server-side routing, so direct hits on a sub-path fall
 * through to /404.html, which bounces back here with the original path stashed
 * in sessionStorage (see the boot block at the bottom).
 */
(function () {
    'use strict';

    var BASE = '/noizy/docs/';
    var MD_BASE = '/docs/';
    var DEFAULT_SLUG = 'overview';

    var NAV = [
        {
            group: '',
            items: [
                { slug: 'overview', file: 'README', title: 'Overview' }
            ]
        },
        {
            group: 'Start here',
            items: [
                { slug: 'getting-started', title: 'Getting started' },
                { slug: 'graph-editor', title: 'The graph editor' },
                { slug: 'nodes', title: 'Nodes' },
                { slug: 'subgraphs', title: 'Subgraphs' }
            ]
        },
        {
            group: 'Using it in your game',
            items: [
                { slug: 'scripting', title: 'Scripting' },
                { slug: 'threading-and-jobs', title: 'Threading and jobs' },
                { slug: 'performance', title: 'Performance' }
            ]
        },
        {
            group: 'No code needed',
            items: [
                { slug: 'terrain', title: 'Terrain component' },
                { slug: 'texture-export', title: 'Texture export' }
            ]
        },
        {
            group: 'Reference',
            items: [
                { slug: 'api-reference', title: 'API reference' },
                { slug: 'examples', title: 'Examples and demos' },
                { slug: 'troubleshooting', title: 'Troubleshooting' },
                { slug: 'license-and-support', title: 'License and support' }
            ]
        }
    ];

    var FLAT = [];
    NAV.forEach(function (section) {
        section.items.forEach(function (item) {
            if (!item.file) item.file = item.slug;
            FLAT.push(item);
        });
    });

    var sourceCache = {};
    var searchIndex = null;
    var searchPending = null;
    var current = null;
    var el = {};

    /* ------------------------------------------------------------- routing */

    function bySlug(slug) {
        for (var i = 0; i < FLAT.length; i++) if (FLAT[i].slug === slug) return FLAT[i];
        return null;
    }

    function byFile(file) {
        for (var i = 0; i < FLAT.length; i++) if (FLAT[i].file === file) return FLAT[i];
        return null;
    }

    function pageUrl(slug, anchor) {
        return BASE + slug + (anchor ? '#' + anchor : '');
    }

    function parseLocation() {
        var path = decodeURIComponent(location.pathname);
        var slug = path.indexOf(BASE) === 0 ? path.slice(BASE.length) : '';
        slug = slug.replace(/^\/+|\/+$/g, '').replace(/\.html?$/i, '');
        return {
            slug: slug || DEFAULT_SLUG,
            anchor: decodeURIComponent((location.hash || '').replace(/^#/, ''))
        };
    }

    /* ------------------------------------------- markdown link/image fixups */

    function resolveHref(href) {
        var plain = href.replace(/&amp;/g, '&');

        if (/^mailto:/i.test(plain)) return { href: href, attrs: '' };
        if (/^(https?:)?\/\//i.test(plain)) {
            return { href: href, attrs: ' target="_blank" rel="noopener"' };
        }
        if (plain === '#' || plain === '') {
            return { href: pageUrl(current.slug), attrs: '' };
        }
        if (plain.charAt(0) === '#') {
            return { href: '#' + plain.slice(1), attrs: '' };
        }

        var md = /^(?:\.\/)?([^#?]*?)\.md(?:#(.*))?$/i.exec(plain);
        if (md) {
            var item = byFile(md[1]);
            return { href: pageUrl(item ? item.slug : md[1], md[2] || ''), attrs: '' };
        }
        return { href: href, attrs: '' };
    }

    function resolveSrc(src) {
        if (/^(https?:)?\/\//i.test(src) || /^data:/i.test(src) || src.charAt(0) === '/') return src;
        return MD_BASE + src.replace(/^\.\//, '');
    }

    /* ------------------------------------------------------------- loading */

    function fetchDoc(file) {
        if (sourceCache[file]) return Promise.resolve(sourceCache[file]);
        return fetch(MD_BASE + file + '.md', { cache: 'no-cache' })
            .then(function (res) {
                if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
                return res.text();
            })
            .then(function (text) {
                sourceCache[file] = text;
                return text;
            });
    }

    function load(route) {
        var item = bySlug(route.slug);
        if (!item) {
            current = { slug: route.slug };
            renderMissing(route.slug);
            return;
        }

        current = item;
        setActiveNav(item.slug);
        el.content.classList.add('is-loading');

        fetchDoc(item.file).then(function (md) {
            if (current !== item) return;

            var result = window.Markdown.render(md, {
                resolveHref: resolveHref,
                resolveSrc: resolveSrc
            });

            el.body.innerHTML = result.html;
            el.content.classList.remove('is-loading');
            document.title = (result.title || item.title) + ' - Noizy Docs';

            decorateBackLink();
            addCopyButtons();
            buildToc(result.headings);
            buildPager(item.slug);
            scrollToAnchor(route.anchor, false);
        }).catch(function (err) {
            el.content.classList.remove('is-loading');
            renderError(item.title, err);
        });
    }

    function renderMissing(slug) {
        el.body.innerHTML =
            '<h1>Page not found</h1>' +
            '<p>There is no documentation page called <code>' +
            window.Markdown.escapeHtml(slug) + '</code>.</p>' +
            '<p><a href="' + pageUrl(DEFAULT_SLUG) + '">Back to the docs index</a></p>';
        el.toc.innerHTML = '';
        el.pager.innerHTML = '';
        document.title = 'Not found - Noizy Docs';
        setActiveNav(null);
        window.scrollTo(0, 0);
    }

    function renderError(title, err) {
        var local = location.protocol === 'file:';
        el.body.innerHTML =
            '<h1>' + window.Markdown.escapeHtml(title) + '</h1>' +
            '<div class="doc-error">' +
            '<p><strong>Could not load this page.</strong> ' +
            window.Markdown.escapeHtml(String(err && err.message ? err.message : err)) + '</p>' +
            (local
                ? '<p>The docs are fetched at runtime, which browsers block on <code>file://</code>. ' +
                  'Serve the site over HTTP (for example <code>python -m http.server</code>) and reload.</p>'
                : '<p>Try reloading the page.</p>') +
            '</div>';
        el.toc.innerHTML = '';
        el.pager.innerHTML = '';
    }

    /* ------------------------------------------------------------ chrome UI */

    function buildNav() {
        var html = '';
        NAV.forEach(function (section) {
            if (section.group) html += '<p class="docs-nav-group">' + section.group + '</p>';
            html += '<ul class="docs-nav-list">';
            section.items.forEach(function (item) {
                html += '<li><a class="docs-nav-link" data-slug="' + item.slug + '" href="' +
                    pageUrl(item.slug) + '">' + item.title + '</a></li>';
            });
            html += '</ul>';
        });
        el.nav.innerHTML = html;
    }

    function setActiveNav(slug) {
        var links = el.nav.querySelectorAll('.docs-nav-link');
        for (var i = 0; i < links.length; i++) {
            links[i].classList.toggle('active', links[i].dataset.slug === slug);
        }
    }

    function decorateBackLink() {
        var first = el.body.firstElementChild;
        if (first && first.tagName === 'P' && /^←/.test(first.textContent.trim())) {
            first.classList.add('doc-backlink');
        }
    }

    function addCopyButtons() {
        var blocks = el.body.querySelectorAll('.code-block');
        for (var i = 0; i < blocks.length; i++) {
            (function (block) {
                var btn = document.createElement('button');
                btn.className = 'code-copy';
                btn.type = 'button';
                btn.textContent = 'Copy';
                btn.addEventListener('click', function () {
                    var code = block.querySelector('code');
                    var text = code ? code.textContent : '';
                    var done = function () {
                        btn.textContent = 'Copied';
                        btn.classList.add('copied');
                        setTimeout(function () {
                            btn.textContent = 'Copy';
                            btn.classList.remove('copied');
                        }, 1600);
                    };
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(text).then(done, function () {});
                    } else {
                        var ta = document.createElement('textarea');
                        ta.value = text;
                        document.body.appendChild(ta);
                        ta.select();
                        try { document.execCommand('copy'); done(); } catch (e) {}
                        document.body.removeChild(ta);
                    }
                });
                block.appendChild(btn);
            })(blocks[i]);
        }
    }

    function buildToc(headings) {
        var usable = headings.filter(function (h) { return h.level === 2 || h.level === 3; });
        if (usable.length < 2) {
            el.toc.innerHTML = '';
            el.toc.classList.add('is-empty');
            return;
        }
        el.toc.classList.remove('is-empty');
        var html = '<p class="docs-toc-title">On this page</p><ul>';
        usable.forEach(function (h) {
            html += '<li class="toc-h' + h.level + '"><a href="#' + h.id + '" data-id="' + h.id + '">' +
                window.Markdown.escapeHtml(h.text) + '</a></li>';
        });
        el.toc.innerHTML = html + '</ul>';
    }

    function buildPager(slug) {
        var idx = -1;
        for (var i = 0; i < FLAT.length; i++) if (FLAT[i].slug === slug) idx = i;
        var prev = idx > 0 ? FLAT[idx - 1] : null;
        var next = idx >= 0 && idx < FLAT.length - 1 ? FLAT[idx + 1] : null;

        var html = '';
        html += prev
            ? '<a class="docs-pager-link prev" href="' + pageUrl(prev.slug) +
              '"><span class="docs-pager-label">Previous</span><span class="docs-pager-title">' +
              prev.title + '</span></a>'
            : '<span></span>';
        html += next
            ? '<a class="docs-pager-link next" href="' + pageUrl(next.slug) +
              '"><span class="docs-pager-label">Next</span><span class="docs-pager-title">' +
              next.title + '</span></a>'
            : '<span></span>';
        el.pager.innerHTML = html;
    }

    // Landing on a new page jumps; clicking an anchor on the page you're
    // already reading glides, so you can see where you were taken from.
    function scrollToAnchor(anchor, smooth) {
        var behavior = smooth ? 'smooth' : 'instant';
        var target = anchor ? document.getElementById(anchor) : null;

        if (!target) {
            window.scrollTo({ top: 0, behavior: behavior });
            highlightToc();
            return;
        }

        window.scrollTo({
            top: target.getBoundingClientRect().top + window.pageYOffset - 90,
            behavior: behavior
        });
        target.classList.add('heading-flash');
        setTimeout(function () { target.classList.remove('heading-flash'); }, 1200);
        highlightToc();
    }

    function highlightToc() {
        var tocLinks = el.toc.querySelectorAll('a');
        if (!tocLinks.length) return;
        var scrollPos = window.pageYOffset + 120;
        var activeId = null;
        for (var i = 0; i < tocLinks.length; i++) {
            var heading = document.getElementById(tocLinks[i].dataset.id);
            if (heading && heading.getBoundingClientRect().top + window.pageYOffset <= scrollPos) {
                activeId = tocLinks[i].dataset.id;
            }
        }
        for (var j = 0; j < tocLinks.length; j++) {
            tocLinks[j].classList.toggle('active', tocLinks[j].dataset.id === activeId);
        }
    }

    /* ----------------------------------------------------------- navigation */

    function go(url, replace) {
        var target = new URL(url, location.origin);
        var samePage = target.pathname === location.pathname;

        if (replace) history.replaceState(null, '', target.pathname + target.hash);
        else history.pushState(null, '', target.pathname + target.hash);

        closeSearch();
        el.sidebar.classList.remove('open');

        var route = parseLocation();
        if (samePage && current && current.slug === route.slug) scrollToAnchor(route.anchor, true);
        else load(route);
    }

    /* -------------------------------------------------------------- search */

    function buildSearchIndex() {
        if (searchIndex) return Promise.resolve(searchIndex);
        if (searchPending) return searchPending;

        searchPending = Promise.all(FLAT.map(function (item) {
            return fetchDoc(item.file)
                .then(function (md) { return { item: item, md: md }; })
                .catch(function () { return { item: item, md: '' }; });
        })).then(function (docs) {
            searchIndex = docs.map(function (doc) {
                var inCode = false;
                var section = '';
                var entries = [];
                doc.md.split('\n').forEach(function (line) {
                    if (/^\s*(```|~~~)/.test(line)) { inCode = !inCode; return; }
                    if (inCode) return;
                    var h = /^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
                    if (h) {
                        section = h[2].replace(/[`*_]/g, '');
                        entries.push({ heading: section, text: section, isHeading: true });
                        return;
                    }
                    var text = line.trim();
                    if (text.length < 12) return;
                    entries.push({ heading: section, text: text.replace(/[`*_>|]/g, '').trim(), isHeading: false });
                });
                return { item: doc.item, entries: entries };
            });
            return searchIndex;
        });

        return searchPending;
    }

    function runSearch(query) {
        var q = query.trim().toLowerCase();
        if (q.length < 2) {
            closeSearch();
            el.results.innerHTML = '';
            return;
        }

        buildSearchIndex().then(function (index) {
            if (el.search.value.trim().toLowerCase() !== q) return;

            var hits = [];
            index.forEach(function (doc) {
                if (doc.item.title.toLowerCase().indexOf(q) !== -1) {
                    hits.push({
                        score: 106,
                        page: doc.item,
                        anchor: '',
                        label: doc.item.title,
                        snippet: 'Documentation page'
                    });
                }
                var seen = {};
                doc.entries.forEach(function (entry) {
                    var pos = entry.text.toLowerCase().indexOf(q);
                    if (pos === -1) return;
                    // One hit per section: the heading wins, since headings are
                    // indexed before the lines that follow them.
                    var anchor = entry.heading ? window.Markdown.slugify(entry.heading) : '';
                    if (seen[anchor]) return;
                    seen[anchor] = true;
                    hits.push({
                        score: (entry.isHeading ? 50 : 10) - Math.min(pos, 40) / 10,
                        page: doc.item,
                        anchor: anchor,
                        label: entry.isHeading ? entry.text : (entry.heading || doc.item.title),
                        snippet: entry.isHeading ? doc.item.title : entry.text
                    });
                });
            });

            hits.sort(function (a, b) { return b.score - a.score; });
            hits = hits.slice(0, 14);

            if (!hits.length) {
                el.results.innerHTML = '<p class="docs-search-empty">No matches for "' +
                    window.Markdown.escapeHtml(query.trim()) + '"</p>';
                el.results.classList.add('open');
                return;
            }

            el.results.innerHTML = hits.map(function (hit) {
                return '<a class="docs-search-hit" href="' + pageUrl(hit.page.slug, hit.anchor) + '">' +
                    '<span class="docs-search-hit-page">' + hit.page.title + '</span>' +
                    '<span class="docs-search-hit-label">' + mark(hit.label, q) + '</span>' +
                    '<span class="docs-search-hit-snippet">' + mark(trimSnippet(hit.snippet, q), q) + '</span>' +
                    '</a>';
            }).join('');
            el.results.classList.add('open');
        });
    }

    function trimSnippet(text, q) {
        var pos = text.toLowerCase().indexOf(q);
        if (pos < 40) return text.slice(0, 120) + (text.length > 120 ? '...' : '');
        return '...' + text.slice(pos - 30, pos + 90) + (text.length > pos + 90 ? '...' : '');
    }

    function mark(text, q) {
        var escaped = window.Markdown.escapeHtml(text);
        var idx = escaped.toLowerCase().indexOf(q);
        if (idx === -1) return escaped;
        return escaped.slice(0, idx) + '<mark>' + escaped.slice(idx, idx + q.length) +
            '</mark>' + escaped.slice(idx + q.length);
    }

    function closeSearch() {
        el.results.classList.remove('open');
    }

    /* ---------------------------------------------------------------- init */

    document.addEventListener('DOMContentLoaded', function () {
        el.nav = document.getElementById('docs-nav');
        el.body = document.getElementById('doc-body');
        el.content = document.getElementById('docs-content');
        el.toc = document.getElementById('docs-toc');
        el.pager = document.getElementById('docs-pager');
        el.search = document.getElementById('docs-search');
        el.results = document.getElementById('docs-search-results');
        el.sidebar = document.getElementById('docs-sidebar');
        el.toggle = document.getElementById('docs-menu-toggle');

        if (!el.body) return;

        // Routing does its own scrolling; don't let the browser fight it.
        if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

        // 404.html stashes the requested path before bouncing us here.
        var bounced = sessionStorage.getItem('noizy-docs-path');
        if (bounced) {
            sessionStorage.removeItem('noizy-docs-path');
            history.replaceState(null, '', bounced);
        }

        buildNav();
        load(parseLocation());

        window.addEventListener('popstate', function () {
            var route = parseLocation();
            closeSearch();
            el.sidebar.classList.remove('open');
            if (current && current.slug === route.slug) scrollToAnchor(route.anchor, false);
            else load(route);
        });

        // Intercept in-app links so navigation stays client-side.
        document.addEventListener('click', function (e) {
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            var a = e.target.closest('a');
            if (!a || a.target === '_blank' || a.hasAttribute('download')) return;

            var url;
            try { url = new URL(a.href, location.href); } catch (err) { return; }
            if (url.origin !== location.origin) return;

            if (url.pathname === location.pathname && url.hash) {
                e.preventDefault();
                go(url.pathname + url.hash);
                return;
            }
            if (url.pathname.indexOf(BASE) !== 0) return;
            e.preventDefault();
            go(url.pathname + url.hash);
        });

        el.search.addEventListener('input', function () { runSearch(el.search.value); });
        el.search.addEventListener('focus', function () { buildSearchIndex(); });
        el.search.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') { el.search.value = ''; closeSearch(); el.search.blur(); }
            if (e.key === 'Enter') {
                var first = el.results.querySelector('.docs-search-hit');
                if (first) { go(first.getAttribute('href')); el.search.blur(); }
            }
        });

        document.addEventListener('click', function (e) {
            if (!e.target.closest('.docs-search')) closeSearch();
            if (!e.target.closest('#docs-sidebar') && !e.target.closest('#docs-menu-toggle')) {
                el.sidebar.classList.remove('open');
            }
        });

        document.addEventListener('keydown', function (e) {
            if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) &&
                document.activeElement !== el.search) {
                e.preventDefault();
                el.search.focus();
                el.search.select();
            }
        });

        el.toggle.addEventListener('click', function (e) {
            e.stopPropagation();
            el.sidebar.classList.toggle('open');
        });

        var ticking = false;
        window.addEventListener('scroll', function () {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(function () {
                highlightToc();
                ticking = false;
            });
        });
    });
})();
