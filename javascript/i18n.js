class I18n {
  constructor(dict, lang = 'ru') {
    this.dict = dict;
    this.lang = localStorage.getItem('lang') || lang;
    this.anims = new WeakMap();
    this.apply(false);
  }

  t(k) { return this.dict[this.lang][k] || k; }

  toggle() {
    this.lang = this.lang === 'ru' ? 'en' : 'ru';
    localStorage.setItem('lang', this.lang);
    this.apply(true);
  }

  apply(animate) {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const v = this.dict[this.lang][el.dataset.i18n];
      if (!v) return;
      const isVisible = el.offsetParent !== null;
      if (animate && isVisible) {
        this.animateTo(el, v);
      } else {
        this.cancel(el);
        el.textContent = v;
      }
    });
    document.documentElement.lang = this.lang;
    const btn = document.getElementById('langToggle');
    if (btn) btn.textContent = this.lang.toUpperCase();
  }

  animateTo(el, text) {
    const gen = (this.anims.get(el) || 0) + 1;
    this.anims.set(el, gen);
    this.runVisual(el, text, gen);
  }

  cancel(el) { this.anims.set(el, (this.anims.get(el) || 0) + 1); }

  getVisualLines(el, text) {
    if (!text) return [];
    const tokens = text.split(/(\s+)/);
    el.replaceChildren();
    for (const tok of tokens) {
      if (/^\s+$/.test(tok)) {
        el.appendChild(document.createTextNode(tok));
      } else {
        const span = document.createElement('span');
        span.textContent = tok;
        el.appendChild(span);
      }
    }

    const lines = [];
    let currentLine = '';
    let lastTop = null;

    for (const node of el.childNodes) {
      if (node.nodeType === 1) {
        const top = Math.round(node.getBoundingClientRect().top);
        if (lastTop !== null && Math.abs(top - lastTop) > 2) {
          lines.push(currentLine.trimEnd());
          currentLine = '';
        }
        lastTop = top;
        currentLine += node.textContent;
      } else {
        currentLine += node.textContent;
      }
    }
    if (currentLine.trim()) lines.push(currentLine.trimEnd());
    return lines;
  }

  async runVisual(el, target, gen) {
    const alive = () => this.anims.get(el) === gen;
    const cur = el.textContent;
    if (cur === target) return;

    const curLines = this.getVisualLines(el, cur);
    const targetLines = this.getVisualLines(el, target);
    if (!alive()) return;

    const totalLines = Math.max(curLines.length, targetLines.length);

    el.innerHTML = '';
    const lineEls = [];
    for (let i = 0; i < totalLines; i++) {
      const div = document.createElement('div');
      div.style.minHeight = '1.2em';
      div.textContent = curLines[i] || '';
      el.appendChild(div);
      lineEls.push(div);
    }

    await Promise.all(
      lineEls.map((lineEl, i) =>
        this.animateLine(lineEl, curLines[i] || '', targetLines[i] || '', alive)
      )
    );

    if (alive()) {
      el.textContent = target;
    }
  }

  async animateLine(el, cur, target, alive) {
    const maxLen = Math.max(cur.length, target.length, 20);
    const speed = Math.max(0.5, 35 / maxLen);
    const chars = cur.split('');

    while (chars.length) {
      if (!alive()) return;
      chars.pop();
      el.textContent = chars.join('');
      await this.sleep(this.rand(6, 16) * speed);
    }

    const t = target.split('');
    for (let i = 0; i < t.length; i++) {
      if (!alive()) return;
      if (Math.random() < 0.07 && i > 0) {
        chars.push(this.glitch());
        el.textContent = chars.join('');
        await this.sleep(this.rand(20, 60) * speed);
        if (!alive()) return;
        chars.pop();
        el.textContent = chars.join('');
        await this.sleep(this.rand(12, 35) * speed);
      }
      chars.push(t[i]);
      el.textContent = chars.join('');
      await this.sleep((Math.random() < 0.08 ? this.rand(45, 100) : this.rand(10, 28)) * speed);
    }

    if (alive()) el.textContent = target;
  }

  glitch() { return '!@#$%^&*~?<>/\\|{}[]'[Math.floor(Math.random() * 16)]; }
  sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
  rand(a, b) { return Math.floor(Math.random() * (b - a) + a); }
}

const translations = {
  ru: {
    xviizyk: 'ИксВизик',
    tab_activity: 'Активность',
    tab_about: 'Обо мне',
    tab_projects: 'Проекты',
    tab_art: 'Художество',
    recent_commits: 'Последние коммиты',
    graph_title: 'Граф активности',
    graph_less: 'Меньше',
    graph_more: 'Больше',
    about_title: 'Это я — ИксВизик!',
    about_subtitle: 'Приветик!',
    about_p1: 'Привет! Я ИксВизик (Xviizyk) — разработчик, дизайнер и начинающий художник.',
    about_p2: 'Бэкенд-разработчик · инди-разработчик',
    about_p3: 'Программист с опытом в бэкенд-разработке, спортивном программировании и инди-геймдеве.',
    about_p4: 'Работал с C++, C#, Python и Java. Есть опыт разработки под Linux.',
    about_p5: 'Люблю небольшие эксперименты: генеративный ИИ, лёгкие приложения и моддинг для игр.',
    about_p6: 'Геймдев: работал с Godot, Unreal Engine и Unity, а сейчас активно делаю 2D- и 3D-игры на Godot.',
    about_p7: 'Писал библиотеки на C# и экспериментировал с рендерингом сцен на Raylib (C++). Нравится делать полезные штуки для пользователей и разработчиков.',
    about_p8: 'Рисовать я только начинаю, так что арты на этом сайте появятся нескоро.',
    about_skills: 'Скилы',
    about_links: 'Ссылки',
    about_engines: 'Игровые движки',
    gh_joined: 'Присоединился',
    gh_years_ago: 'лет назад',
    gh_followed_by: 'Подписчиков',
    gh_contributed_to: 'Вклад в',
    gh_repos: 'репозиториев',
    gh_activity: 'Активность',
    gh_commits: 'Коммитов',
    gh_prs: 'Пулл-реквестов',
    gh_issues: 'Ишью',
    gh_repos_title: 'Репозитории',
    gh_stars: 'Звезд',
    gh_forks: 'Форков',
    gh_watchers: 'Наблюдателей',
    gh_size: 'Размер',
    gh_languages: 'Языки',
    gh_most_used: 'Самые используемые',
    gh_calendar: 'Календарь',
    gh_best_streak: 'Лучшая серия',
    gh_days: 'дней',
    gh_highest_day: 'Максимум за день',
    gh_average_day: 'В среднем',
    art_empty: 'Упс, здесь ещё ничего нет...'
  },
  en: {
    xviizyk: 'Xviizyk',
    tab_activity: 'Activity',
    tab_about: 'About Me',
    tab_projects: 'Projects',
    tab_art: 'Artwork',
    recent_commits: 'Recent Commits',
    graph_title: 'Activity Graph',
    graph_less: 'Less',
    graph_more: 'More',
    about_title: "It's Me — Xviizyk!",
    about_subtitle: 'Hey there!',
    about_p1: "Hi! I'm Xviizyk — a developer, designer, and aspiring artist.",
    about_p2: 'Backend Developer · Indie Developer',
    about_p3: 'A programmer with experience in backend development, competitive programming, and indie game development.',
    about_p4: "I've worked with C++, C#, Python, and Java, and I have experience developing on Linux.",
    about_p5: 'I enjoy small experiments with generative AI, lightweight apps, and game modding.',
    about_p6: "Game dev: I've worked with Godot, Unreal Engine, and Unity, and I'm currently actively building 2D and 3D games in Godot.",
    about_p7: "I've written libraries in C# and experimented with rendering scenes using the Raylib C++ library. I like building useful tools for both everyday users and fellow developers.",
    about_p8: "I'm just starting out with drawing, so artwork won't be on this site for a while.",
    about_skills: 'Skills',
    about_links: 'Links',
    about_engines: 'Game engines',
    gh_joined: 'Joined',
    gh_years_ago: 'years ago',
    gh_followed_by: 'Followers',
    gh_contributed_to: 'Contributed to',
    gh_repos: 'repositories',
    gh_activity: 'Activity',
    gh_commits: 'Commits',
    gh_prs: 'Pull Requests',
    gh_issues: 'Issues',
    gh_repos_title: 'Repositories',
    gh_stars: 'Stars',
    gh_forks: 'Forks',
    gh_watchers: 'Watchers',
    gh_size: 'Size',
    gh_languages: 'Languages',
    gh_most_used: 'Most Used',
    gh_calendar: 'Calendar',
    gh_best_streak: 'Longest Streak',
    gh_days: 'days',
    gh_highest_day: 'Most Active Day',
    gh_average_day: 'Daily Average',
    art_empty: 'Oops, nothing here yet...'
  },
};

const i18n = new I18n(translations);