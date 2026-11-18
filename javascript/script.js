
(() => {
  'use strict';

  const ART_IMAGES = [
    // art sources
  ];

  let profileData = null;
  const ghStats = {
    languages: []
  };

  const themeBtn = document.getElementById('themeToggle');
  const langBtn = document.getElementById('langToggle');

  function applyTheme(theme) {
    if (theme === 'dark') document.documentElement.dataset.theme = 'dark';
    else delete document.documentElement.dataset.theme;
  }

  const savedTheme = localStorage.getItem('theme');

  if (savedTheme === 'dark' || savedTheme === 'light') applyTheme(savedTheme);
  else if (window.matchMedia('(prefers-color-scheme: dark)').matches) applyTheme('dark');

  themeBtn?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('theme', next);
  });

  langBtn?.addEventListener('click', () => {
    i18n.toggle();
    updateDynamicTranslations();
  });

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? 0;
  }

  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const name = tab.dataset.tab;

      tabs.forEach(t => t.classList.toggle('active', t === tab));
      panels.forEach(p => p.classList.toggle('active', p.dataset.panel === name));

      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  function fillProfile(data) {
    const bio = document.getElementById('profileBio');

    if (bio) bio.textContent = data.bio || 'Building small things for the web.';

    if (data.avatar_url) {
      const avatar = document.getElementById('avatar');
      if (avatar) avatar.src = data.avatar_url;
    }

    const joined = data.created_at ? Math.floor((Date.now() - new Date(data.created_at)) / 31557600000) : 0;

    setText('gh-joined', joined);
    setText('gh-followers', data.followers);
    setText('gh-repos-count', data.public_repos);
  }

  function renderLanguages() {
    const bar = document.getElementById('lang-bar');
    const list = document.getElementById('lang-list');

    if (!bar || !list) return;

    const colors = ['lang-0', 'lang-1', 'lang-2', 'lang-3', 'lang-4'];

    let barHtml = '';
    let listHtml = '';

    ghStats.languages.forEach((lang, i) => {
      const color = colors[i % colors.length];

      barHtml += `<div class="lang-segment ${color}" style="width:${lang.pct}%"></div>`;

      listHtml += `
        <div class="lang-item">
          <span class="lang-dot ${color}"></span>
          <span class="lang-name">${escapeHtml(lang.name)}</span>
          <span class="lang-pct">${lang.pct}%</span>
        </div>`;
    });

    bar.innerHTML = barHtml;
    list.innerHTML = listHtml;
  }

  function prepareLanguages(languages = {}) {
    const entries = Object.entries(languages)
      .sort((a, b) => b[1] - a[1]);

    const total = entries.reduce((sum, [, bytes]) => sum + bytes, 0);

    ghStats.languages = total ? entries.slice(0, 5).map(
      ([name, bytes]) => (
        {
          name,
          pct: ((bytes / total) * 100).toFixed(1)
        }
      )
    ) : [];

    renderLanguages();
  }

  function renderStats(stats = {}) {
    setText('gh-stars', stats.stars);
    setText('gh-forks', stats.forks);
    setText('gh-watchers', stats.watchers);
    setText('gh-size', ((stats.size || 0) / 1024).toFixed(1) + ' MB');
    setText('gh-prs', stats.prs);
    setText('gh-issues', stats.issues);
    setText('gh-commits', stats.commits);
  }

  function calculateStreaks(days) {
    if (!days.length) return;

    let best = 0;
    let current = 0;
    let highest = 0;
    let total = 0;

    days.forEach(day => {
      total += day.count;
      highest = Math.max(highest, day.count);

      if (day.count > 0) {
        current++;
        best = Math.max(best, current);
      } else {
        current = 0;
      }
    });

    setText('streak-best', best);
    setText('streak-highest', highest);
    setText('streak-average', (total / days.length).toFixed(2));
  }

  function loadGraph(days = []) {
    const graph = document.getElementById('graph');
    if (!graph) return;

    calculateStreaks(days);

    if (!days.length) {
      graph.innerHTML = '<div class="commit-empty">No contributions yet.</div>';
      return;
    }

    graph.innerHTML = '';

    days.forEach(day => {
      const cell = document.createElement('div');

      cell.className = `cell level-${day.level}`;
      cell.title = `${day.date} — ${day.count} contributions`;

      cell.addEventListener('click', () => {
        const title = document.getElementById('commitsTitle');
        if (title) {
          title.dataset.day = day.date;
          title.removeAttribute('data-i18n');
          title.textContent = `${i18n.t('gh_commits')} ${day.date}`;
        }

        showCommitsStatus('Daily commit details are not included in data.json.');
      });

      graph.appendChild(cell);
    });
  }

  const commitList = document.getElementById('commitList');
  const commitsTitle = document.getElementById('commitsTitle');
  const recentBtn = document.getElementById('recentBtn');

  function updateDynamicTranslations() {
    if (commitsTitle?.dataset.day) {
      commitsTitle.textContent = `${i18n.t('gh_commits')} ${commitsTitle.dataset.day}`;
    }
  }

  function renderCommits(items = []) {
    if (!commitList) return;

    if (!items.length) {
      showCommitsStatus('No commits.');
      return;
    }

    commitList.innerHTML = items.map(commit => `
      <li class="commit-item">
        <a class="commit-link" href="${escapeHtml(commit.url)}" target="_blank" rel="noopener">
          <span class="commit-icon"><span class="icon icon-commit"></span></span>
          <div class="commit-body">
            <span class="commit-repo">${escapeHtml(commit.repo)}</span>
            <span class="commit-msg">${escapeHtml(commit.message)}</span>
          </div>
          <span class="commit-ext"><span class="icon icon-external"></span></span>
        </a>
      </li>
    `).join('');
  }

  function showCommitsStatus(text) {
    if (commitList) {
      commitList.innerHTML = `<li class="commit-empty">${escapeHtml(text)}</li>`;
    }
  }

  function loadRecentCommits() {
    if (commitsTitle) {
      delete commitsTitle.dataset.day;
      commitsTitle.setAttribute('data-i18n', 'recent_commits');
      commitsTitle.textContent = i18n.t('recent_commits');
    }

    renderCommits(profileData?.recent_commits || []);
  }

  recentBtn?.addEventListener('click', loadRecentCommits);

  function buildProjectCard(repo, commits) {
    let commitHtml;

    if (commits === null) {
      commitHtml = '<li class="commit-mini-empty">Unavailable</li>';
    } else if (!commits?.length) {
      commitHtml = '<li class="commit-mini-empty">No commits yet</li>';
    } else {
      commitHtml = commits.map(commit => {
        const sha = (commit.sha || '').slice(0, 7);
        const message = escapeHtml((commit.commit?.message || '').split('\n')[0]);

        return `
          <li class="commit-mini">
            <a href="${escapeHtml(commit.html_url)}" target="_blank" rel="noopener">
              <span class="icon icon-commit"></span>
              <span class="commit-hash">${sha}</span>
              <span class="commit-text">${message}</span>
            </a>
          </li>`;
      }).join('');
    }

    return `
      <article class="project-card">
        <a class="project-head" href="${escapeHtml(repo.html_url)}" target="_blank" rel="noopener">
          <div class="project-top">
            <span class="icon icon-folder"></span>
            <h3 class="project-name">${escapeHtml(repo.name)}</h3>
            <span class="icon icon-external project-ext"></span>
          </div>
          <p class="project-desc">${escapeHtml(repo.description || 'No description.')}</p>
          <div class="project-meta">
            <span>${escapeHtml(repo.language || 'code')}</span>
            <span><span class="icon icon-star"></span> ${repo.stargazers_count || 0}</span>
          </div>
        </a>
        <ul class="commit-mini-list">${commitHtml}</ul>
      </article>`;
  }

  function loadProjects(projects = []) {
    const grid = document.getElementById('projectGrid');
    if (!grid) return;

    if (!projects.length) {
      grid.innerHTML = '<div class="commit-empty">No public repositories yet.</div>';
      return;
    }

    grid.innerHTML = projects.map(item => buildProjectCard(item.repo, item.commits)).join('');
  }

  function loadArt() {
    const gallery = document.getElementById('artGallery');
    if (!gallery) return;

    if (!ART_IMAGES.length) {
      gallery.classList.add('empty');
      gallery.innerHTML = '<div class="art-empty" data-i18n="art_empty"></div>';

      const empty = gallery.firstElementChild;
      if (empty) empty.textContent = i18n.t('art_empty');

      return;
    }

    gallery.classList.remove('empty');

    gallery.innerHTML = ART_IMAGES.map((src, i) => `
      <a class="art-card" href="${escapeHtml(src)}" target="_blank" rel="noopener">
        <img src="${escapeHtml(src)}" alt="Art ${i + 1}" loading="lazy">
      </a>
    `).join('');
  }

  async function loadData() {
    try {
      const res = await fetch('./data.json', { cache: 'no-store' });

      if (!res.ok) throw new Error(`data.json: HTTP ${res.status}`);

      profileData = await res.json();

      if (!profileData.profile || !profileData.totals) {
        throw new Error('Invalid data.json structure');
      }

      fillProfile(profileData.profile);
      renderStats(profileData.stats || profileData.totals);
      prepareLanguages(profileData.languages);
      renderCommits(profileData.recent_commits);
      loadGraph(profileData.contributions);
      loadProjects(profileData.projects);

      console.log('✓ Profile data loaded');
    } catch (err) {
      console.error('Profile loading failed:', err);

      showCommitsStatus('Failed to load profile data.');

      const graph = document.getElementById('graph');
      const projects = document.getElementById('projectGrid');

      if (graph) graph.innerHTML = '<div class="commit-empty">Failed to load data.</div>';
      if (projects) projects.innerHTML = '<div class="commit-empty">Failed to load data.</div>';
    }
  }

  loadArt();
  loadData();

})();
