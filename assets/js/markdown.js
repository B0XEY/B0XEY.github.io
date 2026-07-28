/*
 * Tiny dependency-free Markdown renderer for the Noizy docs.
 * Supports: ATX + setext headings, fenced/indented code, tables, blockquotes,
 * nested + task lists, horizontal rules, raw HTML, and the usual inline set
 * (code, links, images, autolinks, bold, italic, strikethrough, hard breaks).
 */
(function (global) {
    'use strict';

    /* ---------------------------------------------------------------- utils */

    function escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // Turns rendered inline HTML back into plain text, for heading slugs.
    function textOf(html) {
        return html
            .replace(/<[^>]*>/g, '')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&');
    }

    // GitHub-compatible heading slugs, so cross-doc "#some-heading" links work.
    function slugify(text) {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-{2,}/g, '-')
            .replace(/^-|-$/g, '');
    }

    /* ------------------------------------------------------ syntax highlight */

    var HIGHLIGHT_RULES = {
        csharp: [
            ['comment', /\/\/[^\n]*|\/\*[\s\S]*?\*\//y],
            ['string', /@"(?:[^"]|"")*"|\$?"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/y],
            ['meta', /#[ \t]*(?:if|else|elif|endif|region|endregion|define|pragma)[^\n]*/y],
            ['number', /\b(?:0[xX][0-9a-fA-F_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?)[fFdDmMuUlL]{0,2}\b/y],
            ['keyword', /\b(?:abstract|as|async|await|base|bool|break|byte|case|catch|char|checked|class|const|continue|decimal|default|delegate|do|double|else|enum|event|explicit|extern|false|finally|fixed|float|for|foreach|get|goto|if|implicit|in|init|int|interface|internal|is|lock|long|nameof|namespace|new|null|object|operator|out|override|params|partial|private|protected|public|readonly|record|ref|return|sbyte|sealed|set|short|sizeof|stackalloc|static|string|struct|switch|this|throw|true|try|typeof|uint|ulong|unchecked|unsafe|ushort|using|value|var|virtual|void|volatile|when|where|while|yield)\b/y],
            ['fn', /\b[A-Za-z_]\w*(?=\s*[(<][^<>]*?\)?)/y],
            ['type', /\b[A-Z]\w*\b/y]
        ],
        json: [
            ['string', /"(?:[^"\\]|\\.)*"(?=\s*:)/y, 'key'],
            ['string', /"(?:[^"\\]|\\.)*"/y],
            ['number', /-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/y],
            ['keyword', /\b(?:true|false|null)\b/y]
        ],
        shell: [
            ['comment', /#[^\n]*/y],
            ['string', /"(?:[^"\\]|\\.)*"|'[^']*'/y],
            ['keyword', /\b(?:cd|echo|export|git|npm|sudo|mkdir|rm|cp|mv|ls)\b/y]
        ]
    };

    var LANG_ALIASES = {
        cs: 'csharp',
        'c#': 'csharp',
        csharp: 'csharp',
        json: 'json',
        sh: 'shell',
        bash: 'shell',
        shell: 'shell',
        console: 'shell'
    };

    function highlight(code, lang) {
        var rules = HIGHLIGHT_RULES[LANG_ALIASES[(lang || '').toLowerCase()]];
        if (!rules) return escapeHtml(code);

        var out = '';
        var plain = '';
        var pos = 0;

        while (pos < code.length) {
            var matched = null;
            for (var r = 0; r < rules.length; r++) {
                var re = rules[r][1];
                re.lastIndex = pos;
                var m = re.exec(code);
                if (m && m[0]) {
                    matched = { text: m[0], cls: rules[r][2] || rules[r][0] };
                    break;
                }
            }
            if (matched) {
                if (plain) { out += escapeHtml(plain); plain = ''; }
                out += '<span class="tok-' + matched.cls + '">' + escapeHtml(matched.text) + '</span>';
                pos += matched.text.length;
            } else {
                plain += code[pos];
                pos++;
            }
        }
        if (plain) out += escapeHtml(plain);
        return out;
    }

    /* -------------------------------------------------------------- inline */

    var INLINE_HTML = /^<\/?[A-Za-z][\w-]*(?:\s[^<>]*)?\/?>/;

    // Sentinel used to park already-rendered fragments while the remaining
    // inline rules run over the rest of the text.
    var MARK = '\u0000';
    var RE_MARK = /\u0000(\d+)\u0000/g;

    function renderInline(src, ctx) {
        var stash = [];

        function hold(html) {
            stash.push(html);
            return MARK + (stash.length - 1) + MARK;
        }

        var out = String(src);

        // Code spans first: their contents are literal, no further parsing.
        out = out.replace(/(`+)([\s\S]+?)\1(?!`)/g, function (_, ticks, code) {
            var c = code.replace(/\n/g, ' ');
            if (/^ .* $/.test(c) && /[^ ]/.test(c)) c = c.slice(1, -1);
            return hold('<code>' + escapeHtml(c) + '</code>');
        });

        // Backslash escapes.
        out = out.replace(/\\([\\`*_{}\[\]()#+\-.!>~|])/g, function (_, ch) {
            return hold(escapeHtml(ch));
        });

        // Hard line breaks.
        out = out.replace(/ {2,}\n/g, function () { return hold('<br>') + '\n'; });

        // <https://...> autolinks and raw inline HTML.
        out = out.replace(/<[^<>\s][^<>]*>/g, function (tag) {
            var link = /^<((?:https?:\/\/|mailto:)[^>\s]+)>$/.exec(tag);
            if (link) {
                return hold('<a href="' + escapeHtml(link[1]) + '" target="_blank" rel="noopener">' +
                    escapeHtml(link[1].replace(/^mailto:/, '')) + '</a>');
            }
            if (INLINE_HTML.test(tag)) return hold(tag);
            return tag;
        });

        out = escapeHtml(out);

        // Images.
        out = out.replace(/!\[([^\]]*)\]\(\s*([^\s)]+)(?:\s+&quot;([^&]*)&quot;)?\s*\)/g,
            function (_, alt, src2, title) {
                var t = title ? ' title="' + title + '"' : '';
                return hold('<img src="' + ctx.resolveSrc(src2) + '" alt="' + alt + '"' + t + ' loading="lazy">');
            });

        // Links. The label stays in the stream so emphasis inside it still runs.
        out = out.replace(/\[([^\]]*)\]\(\s*([^\s)]*)(?:\s+&quot;([^&]*)&quot;)?\s*\)/g,
            function (_, label, href, title) {
                var link = ctx.resolveHref(href);
                var t = title ? ' title="' + title + '"' : '';
                return hold('<a href="' + link.href + '"' + link.attrs + t + '>') + label + hold('</a>');
            });

        // Bare URLs that weren't already part of a link.
        out = out.replace(/(^|[\s(])(https?:\/\/[^\s<>()\u0000]+[^\s<>().,;:!?\u0000])/g,
            function (_, pre, url) {
                return pre + hold('<a href="' + url + '" target="_blank" rel="noopener">' + url + '</a>');
            });

        out = out.replace(/~~(?=\S)([\s\S]*?\S)~~/g, '<del>$1</del>');
        out = out.replace(/\*\*\*(?=\S)([\s\S]*?\S)\*\*\*/g, '<strong><em>$1</em></strong>');
        out = out.replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, '<strong>$1</strong>');
        out = out.replace(/(^|[^\w\\])__(?=\S)([\s\S]*?\S)__(?!\w)/g, '$1<strong>$2</strong>');
        out = out.replace(/\*(?=\S)([\s\S]*?\S)\*/g, '<em>$1</em>');
        out = out.replace(/(^|[^\w\\])_(?=\S)([\s\S]*?\S)_(?!\w)/g, '$1<em>$2</em>');

        // Restore stashed fragments (they may nest, so loop until stable).
        for (var pass = 0; pass < 5 && out.indexOf(MARK) !== -1; pass++) {
            out = out.replace(RE_MARK, function (_, n) { return stash[+n]; });
        }
        return out;
    }

    /* -------------------------------------------------------------- blocks */

    var RE_FENCE = /^ {0,3}(`{3,}|~{3,})[ \t]*([^`\n]*)$/;
    var RE_HR = /^ {0,3}(?:(?:\*[ \t]*){3,}|(?:-[ \t]*){3,}|(?:_[ \t]*){3,})$/;
    var RE_ATX = /^ {0,3}(#{1,6})[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/;
    var RE_ITEM = /^( *)([-*+]|\d{1,9}[.)])([ \t]+)(.*)$/;
    var RE_QUOTE = /^ {0,3}>/;
    var RE_TABLE_DIV = /^ {0,3}\|?[ \t]*:?-{1,}:?[ \t]*(?:\|[ \t]*:?-{1,}:?[ \t]*)*\|?[ \t]*$/;
    var RE_HTML_OPEN = /^ {0,3}<(?:[A-Za-z][\w-]*|!--)/;

    function isBlockStart(line) {
        return !line.trim() ||
            RE_FENCE.test(line) ||
            RE_ATX.test(line) ||
            RE_HR.test(line) ||
            RE_QUOTE.test(line) ||
            RE_ITEM.test(line) ||
            RE_HTML_OPEN.test(line);
    }

    function indentOf(line) {
        return /^ */.exec(line)[0].length;
    }

    function splitRow(row) {
        var trimmed = row.trim().replace(/^\|/, '').replace(/\|[ \t]*$/, '');
        var cells = [];
        var cur = '';
        for (var i = 0; i < trimmed.length; i++) {
            if (trimmed[i] === '\\' && trimmed[i + 1] === '|') { cur += '|'; i++; continue; }
            if (trimmed[i] === '|') { cells.push(cur); cur = ''; continue; }
            cur += trimmed[i];
        }
        cells.push(cur);
        return cells.map(function (c) { return c.trim(); });
    }

    function renderBlocks(src, ctx) {
        var lines = src.replace(/\r\n?/g, '\n').replace(/\t/g, '    ').split('\n');
        var out = [];
        var i = 0;

        while (i < lines.length) {
            var line = lines[i];

            if (!line.trim()) { i++; continue; }

            /* fenced code */
            var fence = RE_FENCE.exec(line);
            if (fence) {
                var marker = fence[1][0];
                var len = fence[1].length;
                var lang = fence[2].trim().split(/\s+/)[0];
                var body = [];
                i++;
                while (i < lines.length) {
                    var close = new RegExp('^ {0,3}' + (marker === '`' ? '`' : '~') + '{' + len + ',}[ \\t]*$');
                    if (close.test(lines[i])) { i++; break; }
                    body.push(lines[i]);
                    i++;
                }
                var langClass = lang ? ' class="language-' + escapeHtml(lang) + '"' : '';
                out.push('<div class="code-block"' + (lang ? ' data-lang="' + escapeHtml(lang) + '"' : '') + '>' +
                    '<pre><code' + langClass + '>' + highlight(body.join('\n'), lang) + '</code></pre></div>');
                continue;
            }

            /* thematic break */
            if (RE_HR.test(line)) { out.push('<hr>'); i++; continue; }

            /* ATX heading */
            var atx = RE_ATX.exec(line);
            if (atx) {
                out.push(heading(atx[1].length, atx[2], ctx));
                i++;
                continue;
            }

            /* blockquote */
            if (RE_QUOTE.test(line)) {
                var quote = [];
                while (i < lines.length && lines[i].trim() && !RE_FENCE.test(lines[i])) {
                    if (RE_QUOTE.test(lines[i])) quote.push(lines[i].replace(/^ {0,3}> ?/, ''));
                    else quote.push(lines[i]); // lazy continuation
                    i++;
                }
                out.push('<blockquote>' + renderBlocks(quote.join('\n'), ctx) + '</blockquote>');
                continue;
            }

            /* table */
            if (line.indexOf('|') !== -1 && i + 1 < lines.length && RE_TABLE_DIV.test(lines[i + 1]) &&
                lines[i + 1].indexOf('-') !== -1) {
                var header = splitRow(line);
                var aligns = splitRow(lines[i + 1]).map(function (c) {
                    if (/^:-+:$/.test(c)) return 'center';
                    if (/^-+:$/.test(c)) return 'right';
                    if (/^:-+$/.test(c)) return 'left';
                    return '';
                });
                i += 2;
                var rows = [];
                while (i < lines.length && lines[i].trim() && lines[i].indexOf('|') !== -1) {
                    rows.push(splitRow(lines[i]));
                    i++;
                }
                out.push(renderTable(header, aligns, rows, ctx));
                continue;
            }

            /* list */
            if (RE_ITEM.test(line)) {
                var res = parseList(lines, i, ctx);
                out.push(res.html);
                i = res.next;
                continue;
            }

            /* raw HTML block */
            if (RE_HTML_OPEN.test(line)) {
                var raw = [];
                while (i < lines.length && lines[i].trim()) { raw.push(lines[i]); i++; }
                out.push(raw.join('\n'));
                continue;
            }

            /* indented code block */
            if (indentOf(line) >= 4) {
                var codeLines = [];
                while (i < lines.length && (indentOf(lines[i]) >= 4 || !lines[i].trim())) {
                    codeLines.push(lines[i].slice(4));
                    i++;
                }
                while (codeLines.length && !codeLines[codeLines.length - 1].trim()) codeLines.pop();
                out.push('<div class="code-block"><pre><code>' +
                    escapeHtml(codeLines.join('\n')) + '</code></pre></div>');
                continue;
            }

            /* paragraph (or setext heading) */
            var para = [line];
            i++;
            var setext = 0;
            while (i < lines.length) {
                if (/^ {0,3}=+[ \t]*$/.test(lines[i])) { setext = 1; i++; break; }
                if (/^ {0,3}-+[ \t]*$/.test(lines[i]) && !RE_HR.test(lines[i])) { setext = 2; i++; break; }
                if (isBlockStart(lines[i])) break;
                if (lines[i].indexOf('|') !== -1 && i + 1 < lines.length && RE_TABLE_DIV.test(lines[i + 1])) break;
                para.push(lines[i]);
                i++;
            }
            if (setext) out.push(heading(setext, para.join(' '), ctx));
            else out.push('<p>' + renderInline(para.join('\n'), ctx) + '</p>');
        }

        return out.join('\n');
    }

    function heading(level, text, ctx) {
        var html = renderInline(text, ctx);
        var base = slugify(textOf(html)) || 'section';
        var id = base;
        var n = 1;
        while (ctx.ids[id]) { id = base + '-' + n; n++; }
        ctx.ids[id] = true;
        ctx.headings.push({ level: level, text: textOf(html), id: id });
        return '<h' + level + ' id="' + id + '">' + html + '</h' + level + '>';
    }

    function renderTable(header, aligns, rows, ctx) {
        function cell(tag, text, idx) {
            var align = aligns[idx] ? ' style="text-align:' + aligns[idx] + '"' : '';
            return '<' + tag + align + '>' + renderInline(text, ctx) + '</' + tag + '>';
        }
        var html = '<div class="table-wrap"><table><thead><tr>';
        header.forEach(function (h, idx) { html += cell('th', h, idx); });
        html += '</tr></thead><tbody>';
        rows.forEach(function (row) {
            html += '<tr>';
            for (var c = 0; c < header.length; c++) html += cell('td', row[c] || '', c);
            html += '</tr>';
        });
        return html + '</tbody></table></div>';
    }

    function parseList(lines, start, ctx) {
        var first = RE_ITEM.exec(lines[start]);
        var baseIndent = first[1].length;
        var ordered = /\d/.test(first[2]);
        var startNum = ordered ? parseInt(first[2], 10) : 1;
        var items = [];
        var contentIndents = [];
        var loose = false;
        var i = start;

        while (i < lines.length) {
            var line = lines[i];

            if (!line.trim()) {
                var j = i;
                while (j < lines.length && !lines[j].trim()) j++;
                if (j >= lines.length) break;
                var nextIndent = indentOf(lines[j]);
                var nextItem = RE_ITEM.exec(lines[j]);
                var startsItem = nextItem && nextItem[1].length <= baseIndent + 1;
                var continues = nextIndent >= baseIndent + 2;
                if (!startsItem && !continues) break;
                loose = true;
                for (; i < j; i++) items[items.length - 1].push('');
                continue;
            }

            var indent = indentOf(line);
            var m = RE_ITEM.exec(line);

            if (m && indent <= baseIndent + 1) {
                var sameKind = /\d/.test(m[2]) === ordered;
                if (!sameKind && items.length) break;
                items.push([m[4]]);
                contentIndents.push(indent + m[2].length + m[3].length);
                i++;
                continue;
            }

            if (!items.length) break;

            // Continuation of the current item (indented, or a lazy paragraph line).
            var strip = Math.min(indent, contentIndents[items.length - 1]);
            items[items.length - 1].push(line.slice(strip));
            i++;
        }

        var tag = ordered ? 'ol' : 'ul';
        var attrs = ordered && startNum !== 1 ? ' start="' + startNum + '"' : '';
        var isTaskList = false;

        var html = items.map(function (item) {
            var text = item.join('\n');
            var task = /^\[([ xX])\][ \t]+/.exec(text);
            var checkbox = '';
            if (task) {
                isTaskList = true;
                text = text.slice(task[0].length);
                checkbox = '<input type="checkbox" disabled' +
                    (task[1] !== ' ' ? ' checked' : '') + '> ';
            }
            var content = renderBlocks(text, ctx);
            if (!loose) content = content.replace(/<\/?p>/g, '');
            return '<li' + (task ? ' class="task-item"' : '') + '>' + checkbox + content.trim() + '</li>';
        }).join('');

        return {
            html: '<' + tag + attrs + (isTaskList ? ' class="task-list"' : '') + '>' + html + '</' + tag + '>',
            next: i
        };
    }

    /* ---------------------------------------------------------------- entry */

    /**
     * render(markdown, options) -> { html, headings, title }
     *
     * options.resolveHref (href) -> { href, attrs }   rewrites in-doc links
     * options.resolveSrc  (src) -> string             rewrites image paths
     */
    function render(markdown, options) {
        var opts = options || {};
        var ctx = {
            headings: [],
            ids: {},
            resolveHref: opts.resolveHref || function (href) {
                return { href: escapeHtml(href), attrs: '' };
            },
            resolveSrc: opts.resolveSrc || function (src) { return src; }
        };

        var body = markdown.replace(/^﻿/, '');

        // Strip YAML front matter if a doc ever grows one.
        body = body.replace(/^---\n[\s\S]*?\n---\n/, '');

        var html = renderBlocks(body, ctx);
        var title = null;
        for (var i = 0; i < ctx.headings.length; i++) {
            if (ctx.headings[i].level === 1) { title = ctx.headings[i].text; break; }
        }

        return { html: html, headings: ctx.headings, title: title };
    }

    global.Markdown = {
        render: render,
        slugify: slugify,
        escapeHtml: escapeHtml,
        highlight: highlight
    };
})(window);
