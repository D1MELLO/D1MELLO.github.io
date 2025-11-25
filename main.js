/* main.js - Lógica KISS (Multi-source: Pessoal + Organização) */

const CONFIG = {
    username: 'D1MELLO',
    orgname: 'FIAP-CODERS', // Nome da sua organização
    cacheKey: 'kiss_portfolio_v3_mixed', // Mudei a versão para limpar o cache antigo
    cacheDuration: 1000 * 60 * 60 * 24 // 24 horas
};

// Sanitização de Texto (Segurança)
const escapeHTML = (str) => {
    if (!str) return '';
    return str.replace(/[&<>"']/g,
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[tag]
    );
};

// Renderizar HTML dos Cards
function renderProjects(repos) {
    const container = document.getElementById('github-list');
    container.innerHTML = '';

    // Filtra forks e ordena por data (mais recentes primeiro)
    const projects = repos
        .filter(r => !r.fork)
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    if (projects.length === 0) {
        container.innerHTML = '<p>Nenhum repositório público encontrado.</p>';
        return;
    }

    projects.forEach(repo => {
        const card = document.createElement('article');
        card.className = 'project-card';

        // Verifica se o dono do repositório é a Organização
        const isOrg = repo.owner && repo.owner.login === CONFIG.orgname;
        // Cria uma etiqueta visual
        const labelHTML = isOrg
            ? '<span style="color:var(--accent); font-size:0.7rem; font-weight:bold; display:block; margin-bottom:5px;">[ EQUIPE / FIAP ]</span>'
            : '<span style="color:#666; font-size:0.7rem; font-weight:bold; display:block; margin-bottom:5px;">[ PESSOAL ]</span>';

        card.innerHTML = `
            <div class="card-content">
                ${labelHTML}
                <h4>${escapeHTML(repo.name)}</h4>
                <p>${escapeHTML(repo.description || 'Projeto desenvolvido durante a graduação.')}</p>
                <div class="tags">
                    <span>${escapeHTML(repo.language || 'Code')}</span>
                    <span>⭐ ${repo.stargazers_count}</span>
                </div>
            </div>
            <a href="${escapeHTML(repo.html_url)}" target="_blank" class="project-link">Ver Código -></a>
        `;
        container.appendChild(card);
    });
}

// Função que busca de VÁRIAS fontes ao mesmo tempo
async function fetchAllData() {
    const userUrl = `https://api.github.com/users/${CONFIG.username}/repos`;
    const orgUrl = `https://api.github.com/orgs/${CONFIG.orgname}/repos`;

    try {
        // Dispara as duas buscas em paralelo
        const [userRes, orgRes] = await Promise.all([
            fetch(userUrl),
            fetch(orgUrl)
        ]);

        let combinedRepos = [];

        // Pega seus repositórios
        if (userRes.ok) {
            const userData = await userRes.json();
            combinedRepos = combinedRepos.concat(userData);
        }

        // Pega os repositórios da organização
        if (orgRes.ok) {
            const orgData = await orgRes.json();
            combinedRepos = combinedRepos.concat(orgData);
        }

        return combinedRepos;

    } catch (error) {
        console.error('Erro ao buscar repositórios:', error);
        return []; // Retorna vazio se der erro fatal
    }
}

// Lógica de Cache e Inicialização
function loadGitHubData() {
    const cached = localStorage.getItem(CONFIG.cacheKey);
    const savedTime = localStorage.getItem(CONFIG.cacheKey + '_time');
    const now = Date.now();

    // Se tiver cache válido (menos de 24h), usa ele
    if (cached && savedTime && (now - savedTime < CONFIG.cacheDuration)) {
        renderProjects(JSON.parse(cached));
        return;
    }

    // Se não, vai buscar na internet
    fetchAllData().then(data => {
        if (data.length > 0) {
            localStorage.setItem(CONFIG.cacheKey, JSON.stringify(data));
            localStorage.setItem(CONFIG.cacheKey + '_time', now);
            renderProjects(data);
        } else {
            document.getElementById('github-list').innerHTML = '<p>Erro ao carregar projetos.</p>';
        }
    });
}

// Inicializa
document.addEventListener('DOMContentLoaded', loadGitHubData);