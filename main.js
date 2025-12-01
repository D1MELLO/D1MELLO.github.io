/* main.js - Logic & Experience */

const CONFIG = {
    username: 'D1MELLO',
    orgname: 'FIAP-CODERS',
    topicFilter: 'portfolio',
    cacheKey: 'impact_portfolio_v1',
    cacheDuration: 1000 * 60 * 60 * 24
};

/* --- LANGUAGE SYSTEM --- */
const langBtn = document.getElementById('lang-toggle');
let currentLang = localStorage.getItem('site_lang') || 'pt';

function updateLanguage() {
    const elements = document.querySelectorAll('[data-en]');
    elements.forEach(el => {
        if (!el.getAttribute('data-pt')) el.setAttribute('data-pt', el.innerHTML);
        el.innerHTML = currentLang === 'en' ? el.getAttribute('data-en') : el.getAttribute('data-pt');
    });
    if (langBtn) langBtn.textContent = currentLang === 'pt' ? '[ EN ]' : '[ PT ]';
    localStorage.setItem('site_lang', currentLang);
}

if (langBtn) {
    langBtn.addEventListener('click', () => {
        currentLang = currentLang === 'pt' ? 'en' : 'pt';
        updateLanguage();
    });
}

/* --- SCROLL ANIMATION (REVEAL) --- */
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');

    const revealOnScroll = () => {
        const windowHeight = window.innerHeight;
        const elementVisible = 100;

        reveals.forEach((reveal) => {
            const elementTop = reveal.getBoundingClientRect().top;
            if (elementTop < windowHeight - elementVisible) {
                reveal.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Trigger once on load
}

/* --- GITHUB LOGIC --- */
const escapeHTML = (str) => {
    if (!str) return '';
    return str.replace(/[&<>"']/g,
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[tag]
    );
};

function renderProjects(repos) {
    const container = document.getElementById('github-list');
    container.innerHTML = '';

    const projects = repos
        .filter(repo => {
            if (repo.fork) return false;
            return repo.topics && repo.topics.includes(CONFIG.topicFilter);
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (projects.length === 0) {
        container.innerHTML = '<p>Nenhum projeto encontrado.</p>';
        return;
    }

    projects.forEach(repo => {
        const card = document.createElement('article');
        card.className = 'project-card glass-card'; // Usa o estilo Glass

        const isOrg = repo.owner && repo.owner.login === CONFIG.orgname;

        const labelHTML = isOrg
            ? '<span style="color:var(--neon-yellow); font-size:0.6rem; font-weight:bold; letter-spacing:1px;">[ FIAP ]</span>'
            : '<span style="color:var(--text-muted); font-size:0.6rem; font-weight:bold; letter-spacing:1px;">[ PERSONAL ]</span>';

        let description = repo.description;
        if (!description) {
            description = isOrg ? 'Academic project developed at FIAP.' : 'Personal development project.';
        }

        const dataCriacao = new Date(repo.created_at).getFullYear();

        card.innerHTML = `
            <div class="card-content">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    ${labelHTML}
                    <span style="font-family:var(--font-mono); font-size:0.7rem; opacity:0.5;">${dataCriacao}</span>
                </div>
                <h4 style="margin-bottom:10px;">${escapeHTML(repo.name)}</h4>
                <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:15px;">${escapeHTML(description)}</p>
                <div class="tech-row">
                    <span>${escapeHTML(repo.language || 'Code')}</span>
                    <span>⭐ ${repo.stargazers_count}</span>
                </div>
            </div>
            <a href="${escapeHTML(repo.html_url)}" target="_blank" class="project-link" style="display:block; margin-top:15px; font-size:0.8rem; color:var(--neon-yellow); text-decoration:none;">View Code -></a>
        `;
        container.appendChild(card);
    });
}

async function fetchAllData() {
    const userUrl = `https://api.github.com/users/${CONFIG.username}/repos`;
    const orgUrl = `https://api.github.com/orgs/${CONFIG.orgname}/repos`;

    try {
        const [userRes, orgRes] = await Promise.all([fetch(userUrl), fetch(orgUrl)]);
        let combinedRepos = [];
        if (userRes.ok) combinedRepos = combinedRepos.concat(await userRes.json());
        if (orgRes.ok) combinedRepos = combinedRepos.concat(await orgRes.json());
        return combinedRepos;
    } catch (error) { return []; }
}

function loadGitHubData() {
    const cached = localStorage.getItem(CONFIG.cacheKey);
    const savedTime = localStorage.getItem(CONFIG.cacheKey + '_time');
    const now = Date.now();

    if (cached && savedTime && (now - savedTime < CONFIG.cacheDuration)) {
        renderProjects(JSON.parse(cached));
        return;
    }

    fetchAllData().then(data => {
        if (data.length > 0) {
            localStorage.setItem(CONFIG.cacheKey, JSON.stringify(data));
            localStorage.setItem(CONFIG.cacheKey + '_time', now);
            renderProjects(data);
        } else {
            document.getElementById('github-list').innerHTML = '<p>Erro na conexão.</p>';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    updateLanguage();
    loadGitHubData();
    initScrollReveal();
});