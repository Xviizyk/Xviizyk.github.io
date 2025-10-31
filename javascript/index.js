document.addEventListener("DOMContentLoaded", () => {
  const themeBtn = document.getElementById("toggle-theme");
  const pageTitle = document.getElementById("page-title");
  
  // Elements for Phrasebook
  const searchInput = document.getElementById("search-input");
  const phrasebookTopicsNav = document.getElementById("phrasebook-topics");
  const phrasesContainer = document.getElementById("phrases-container");
  
  // Containers for other sections
  const sightsContainer = document.getElementById("sights-container");
  const cultureContainer = document.getElementById("culture-container");
  const historyContainer = document.getElementById("history-container");
  
  const allViews = document.querySelectorAll('.view');
  
  // Combined data for History, Culture, Sights (translated to English)
  const appData = {
    phrasebook: {},
    sights: {
        kazan: [
            { title:"Kremlin", text:"The main historical fortress of the city." },
            { title:"Annunciation Cathedral", text:"An architectural monument of the 16th century." }
        ],
        bolgar: [
            { title:"Museum-Reserve", text:"Monument of Volga Bulgaria and Islamic culture." },
            { title:"Sheikh Sadyk Mausoleum", text:"A famous historical building." }
        ],
        sviyazhsk: [
            { title:"Island-town", text:"Historical island town with monasteries." },
            { title:"Assumption Cathedral", text:"An ancient 16th-century church." }
        ],
        temples: [
            { title:"Kul Sharif Mosque", text:"The main mosque of the Kazan Kremlin." },
            { title:"Sviyazhsk Churches", text:"Architectural monuments from different eras." }
        ],
        parks: [
            { title:"Sviyazhsky Kholmy National Park", text:"A nature area for recreation and tourism." },
            { title:"Tatarstan Museum of Fine Arts", text:"Collections of painting and graphics." }
        ]
    },
    culture: {
        cuisine: [
            { title:"Echpochmak", text:"Traditional Tatar dish with meat, potatoes, and onion." },
            { title:"Chak-chak", text:"Sweet made of dough and honey, popular on holidays." },
            { title:"Kystyby", text:"Unleavened dough with potatoes or cottage cheese." }
        ],
        crafts: [
            { title:"Wood Carving", text:"Traditional craft with folk patterns." },
            { title:"Embroidery", text:"National ornaments on clothing and fabrics." },
            { title:"Tubeteykas", text:"Traditional patterned headwear." }
        ],
        folklore: [
            { title:"Folk Songs", text:"Songs with kurai and other instruments." },
            { title:"Dances", text:"Traditional dances performed collectively." }
        ],
        holidays: [
            { title:"Sabantuy", text:"The main summer holiday with contests and songs." },
            { title:"Nawruz", "text":"Spring holiday with traditional dishes." }
        ],
        modern: [
            { title:"Opera and Ballet Theatre", text:"Modern productions and classical performances." },
            { title:"Contemporary Artists", text:"Development of painting and art in the 21st century." }
        ]
    },
    
    // Data for History (translated to English)
    history: {
        centuryX: [
            { title:"The Rise of the Bulgar State", text:"Formation of Volga Bulgaria, crafts, trade." },
            { title:"Development of Trade", text:"Active trade with Byzantium, Eastern Europe, and Central Asia." },
            { title:"Adoption of Islam", text:"A part of the population adopted Islam, which influenced culture and law." }
        ],
        centuryXIII: [
            { title:"Mongol-Tatar Horde", text:"Arrival of Mongol conquerors, political changes." },
            { title:"Cultural Development", text:"Preservation of Bulgar culture, crafts, and Islamic traditions." },
            { title:"Construction of Fortresses", text:"Erection of fortifications to protect cities." }
        ],
        centuryXVI: [
            { title:"Kazan Khanate", text:"History of the formation of the Kazan Khanate, struggle with the Moscow principality." },
            { title:"Annexation of Kazan to Russia", text:"In 1552, Kazan was conquered by Ivan the Terrible." },
            { title:"Religious Changes", text:"Spread of Orthodoxy while preserving Islamic communities." }
        ],
        soviet: [
            { title:"Soviet Period", text:"Development of industry, agriculture, and culture in the 20th century." },
            { title:"Education", text:"Creation of schools, universities, and scientific institutes." },
            { title:"Economic Reforms", text:"Industrialization and large enterprises." }
        ],
        present: [
            { title:"Industrial Development", text:"In the 21st century, Tatarstan actively builds new enterprises and implements modern technologies, including IT and innovations." },
            { title:"Cultural Life", text:"Festivals, theatrical performances, and exhibitions make the republic's cultural life diverse and rich." },
            { title:"Preservation of Traditions", text:"The region preserves national traditions, combining them with modern forms of art and education." }
        ]
    }
  };
  fetch("data/phrases.json") 
    .then(res => {
      if (!res.ok) throw new Error("Failed to load phrases.json");
      return res.json();
    })
    .then(json => {
      appData.phrasebook = json;
      if (document.getElementById('phrasebook-view').style.display === 'block') {
          const firstTopic = Object.keys(appData.phrasebook)[0];
          if (firstTopic) showTopic(firstTopic);
      }
      renderTopics(Object.keys(appData.phrasebook));
    })
    .catch(error => {
        console.error("Error loading data:", error);
        phrasesContainer.innerHTML = "<p>Error: Could not load phrasebook data.</p>";
    });
  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    themeBtn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
  });
  function switchView(viewId, title) {
    allViews.forEach(view => {
      view.style.display = 'none';
    });
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.style.display = 'block';
    }
    if (title) pageTitle.textContent = title;
  }
  document.querySelectorAll('#home-view .menu-button').forEach(btn => {
    btn.addEventListener('click', () => {
      const viewId = btn.dataset.view;
      const titleText = btn.textContent;
      switchView(viewId, titleText);
      
      if (viewId === 'phrasebook-view' && Object.keys(appData.phrasebook).length > 0) {
        renderTopics(Object.keys(appData.phrasebook));
        const firstTopic = Object.keys(appData.phrasebook)[0];
        if (firstTopic) showTopic(firstTopic);
      }
      if (viewId !== 'phrasebook-view') {
          document.getElementById(viewId.replace('-view', '-container')).innerHTML = "";
      }
    });
  });
  
  document.querySelectorAll('.back-to-home').forEach(btn => {
    btn.addEventListener('click', () => {
      switchView('home-view', 'Phrasebook and Guide');
    });
  });

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
      phrasesContainer.innerHTML = "<p>No results found.</p>";
      return;
    }

    phrases.forEach(phrase => {
      const card = document.createElement("div");
      card.classList.add("phrase-card");
      
      // ИЗМЕНЕНИЕ: Использование полей *Transcripciya из phrases.json
      // Оригинальный код для транскрипции английского был удален 
      // и заменен на прямое использование полей *Transcripciya.
      const englishText = phrase.English; 
      const englishTranslit = phrase.EnglishTranscripciya || '';
      const russianTranslit = phrase.RussianTranscripciya || '';
      const tatarTranslit = phrase.TatarTranscripciya || '';

      card.innerHTML = `
        <p><strong>English</strong> ${englishText} <span class="translit">${englishTranslit}</span></p>
        <p><strong>Russian</strong> ${phrase.Russian} <span class="translit">${russianTranslit || ''}</span></p>
        <p><strong>Tatar</strong> ${phrase.Tatar} <span class="translit">${tatarTranslit || ''}</span></p>
      `;
      phrasesContainer.appendChild(card);
      observer.observe(card);
    });
  }
  
  // Display phrases of the selected topic (Phrasebook)
  function showTopic(topic) {
    const phrases = appData.phrasebook[topic];
    renderPhrases(phrases);
    searchInput.value = "";
  }
  
  // Render topic buttons (Phrasebook)
  function renderTopics(topics) {
    phrasebookTopicsNav.innerHTML = "";
    
    // Back Button
    const backBtn = document.createElement("button");
    backBtn.textContent = "Back";
    backBtn.classList.add("menu-button", "back-to-home");
    backBtn.addEventListener("click", () => switchView('home-view', 'Phrasebook and Guide'));
    phrasebookTopicsNav.appendChild(backBtn);

    // Topic Buttons
    topics.forEach(topic => {
      const btn = document.createElement("button");
      btn.textContent = topic;
      btn.classList.add("menu-button");
      btn.addEventListener("click", () => showTopic(topic));
      phrasebookTopicsNav.appendChild(btn);
    });
  }
  
  // Search for phrases (Phrasebook)
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    const results = [];
    
    // Search across all phrasebook data
    Object.values(appData.phrasebook).forEach(topic => {
      topic.forEach(phrase => {
        // Search in all fields, including the new transliteration fields (if present)
        const values = Object.values(phrase).join(" ").toLowerCase();
        if (values.includes(query)) results.push(phrase);
      });
    });

    renderPhrases(results);
  });
  
  // Render info cards for History, Culture, Sights
  function renderInfoCards(data, container) {
      container.innerHTML = "";
      if (!data || data.length === 0) {
          container.innerHTML = "<p>No information found.</p>";
          return;
      }
      
      data.forEach(item => {
          const card = document.createElement("div");
          card.classList.add("phrase-card");
          card.innerHTML = `<strong>${item.title}</strong><p>${item.text}</p>`;
          container.appendChild(card);
          observer.observe(card);
      });
  }

  // Handler for category buttons (History/Culture/Sights)
  document.querySelectorAll('.topic-btn').forEach(btn => {
      btn.addEventListener('click', () => {
          const category = btn.dataset.topicCategory;
          const topicName = btn.dataset.topicName;
          let container;
          
          if (category === 'history') container = historyContainer;
          else if (category === 'culture') container = cultureContainer;
          else if (category === 'sights') container = sightsContainer;
          else return;

          const dataToRender = appData[category][topicName];
          renderInfoCards(dataToRender, container);
      });
  });

  // Initialization: Display home view and load data (performed at the start)
  switchView('home-view', 'Phrasebook and Guide');
});