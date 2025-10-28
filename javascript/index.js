document.addEventListener("DOMContentLoaded", () => {
  const themeBtn = document.getElementById("toggle-theme");
  const searchInput = document.getElementById("search-input");
  const topicsContainer = document.getElementById("topics");
  const phrasesContainer = document.getElementById("phrases-container");

  let data = {};
  let allPhrases = [];

  // Переключение темы
  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    themeBtn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
  });

  // Загрузка данных
  fetch("data/phrases.json")
    .then(res => res.json())
    .then(json => {
      data = json;
      renderTopics(Object.keys(data));
      
      const urlParams = new URLSearchParams(window.location.search);
      const topic = urlParams.get("topic");
      if (topic && data[topic]) showTopic(topic);
    });

  // Рендер кнопки Назад и всех тем
  function renderTopics(topics) {
    topicsContainer.innerHTML = ""; // очищаем контейнер

    // Кнопка Назад
    const backBtn = document.createElement("button");
    backBtn.textContent = "Назад";
    backBtn.classList.add("menu-button");
    backBtn.addEventListener("click", () => window.history.back());
    topicsContainer.appendChild(backBtn);

    // Кнопки тем
    topics.forEach(topic => {
      const btn = document.createElement("button");
      btn.textContent = topic;
      btn.classList.add("menu-button");
      btn.addEventListener("click", () => showTopic(topic));
      topicsContainer.appendChild(btn);
    });
  }

  // Показ фраз выбранной темы
  function showTopic(topic) {
    const phrases = data[topic];
    allPhrases = phrases;
    renderPhrases(phrases);
    searchInput.value = "";
  }

  // Плавное появление карточек через IntersectionObserver
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  function renderPhrases(phrases) {
    phrasesContainer.innerHTML = "";
    if (!phrases || phrases.length === 0) {
      phrasesContainer.innerHTML = "<p>Ничего не найдено.</p>";
      return;
    }

    phrases.forEach(phrase => {
      const card = document.createElement("div");
      card.classList.add("phrase-card");
      card.innerHTML = `
        <p><strong>eng</strong> ${phrase.English}</p>
        <p><strong>rus</strong> ${phrase.Russian}</p>
        <p><strong>tat</strong> ${phrase.Tatar}</p>
      `;
      phrasesContainer.appendChild(card);
      observer.observe(card);
    });
  }

  // Поиск по фразам
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    const results = [];

    Object.values(data).forEach(topic => {
      topic.forEach(phrase => {
        const values = Object.values(phrase).join(" ").toLowerCase();
        if (values.includes(query)) results.push(phrase);
      });
    });

    allPhrases = results;
    renderPhrases(results);
  });
});
