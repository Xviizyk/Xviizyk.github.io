const $ = id=> document.getElementById(id);
const themeButton = $("toggle-theme");
const pageTitle = $("page-title");
const searchInput = $("search-input");
const phrasebookTopicsNav = $("phrasebook-topics");
const phrasesContainer = $("phrases-container");
const sightsContainer = $("sights-container");
const cultureContainer = $("culture-container");
const historyContainer = $("history-container");
const allViews = document.querySelectorAll('.view');

const mainData ={};

function tatToRus(tatarText){
    const replaces ={
        'Ә': 'Э', 'ә': 'э', 'Ө': 'О', 'ө': 'ё', 'Ү': 'У', 'ү': 'у',
        'Җ': 'Ж', 'җ': 'ж', 'Ң': 'Н', 'ң': 'н', 'Һ': 'Х', 'һ': 'х',
        'Қ': 'К', 'қ': 'к', 'Ч': 'Щ', 'ч': 'щ', 'Й': 'иъ', 'й': 'иъ',
        'Лл': 'Л', 'лл': 'л', 'Л': 'Ль', 'л': 'ль',
    };
    let normalizedText = tatarText;
    for (const [tatarChar, russianChar] of Object.entries(replaces)){
        normalizedText = normalizedText.replace(new RegExp(tatarChar, 'g'), russianChar);
    }
    return normalizedText;
}

function speakText(text, language){
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = window.speechSynthesis.getVoices().find(v=> v.lang.startsWith(language.substring(0, 2)));

    if(voice){
      utterance.voice = voice;
    } else{
      utterance.lang = language;
    }

    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
}

fetch("data/data.json")
  .then(res => {
    if (!res.ok) {
        console.error('Failed to load JSON:', res.status, res.statusText);
        return null;
    }
    return res.json();
  })
  .then(json => {
    if (json) {
        Object.assign(mainData, json);
        mainData.phrasebook = mainData.phrasebook || mainData.phrases;
        delete mainData.phrases;
        initializePhrasebook();
        renderPhrasebookTopics();
    }
  })
  .catch(error => {
    console.error("Error loading or parsing JSON:", error);
  });


themeButton.addEventListener("click", ()=>{
  document.body.classList.toggle("dark");
  themeButton.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
});

function switchView(viewId, title){
  allViews.forEach(view=> view.style.display = 'none');
  $(viewId).style.display = 'block';
  pageTitle.textContent = title;
}

document.querySelectorAll('#home-view .menu-button').forEach(button=>{
  button.addEventListener('click', ()=>{
    const viewId = button.dataset.view;
    switchView(viewId, button.textContent);
    
    if(viewId === 'phrasebook-view'){
      const topics = Object.keys(mainData.phrasebook);
      showTopic(topics[0]);
    }
  });
});

document.querySelectorAll('.back-to-home').forEach(button=>{
  button.addEventListener('click', ()=> switchView('home-view', 'Phrasebook and Guide'));
});

const observer = new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, 
{ threshold: 0.2 });

function showPhrases(phrases){
  phrasesContainer.innerHTML = "";
  phrases.forEach(phrase=>{
    const{ English, Russian, Tatar, EnglishTranscripciya: EngTranslit = '', RussianTranscripciya: RusTranslit = '', TatarTranscripciya: TatTranslit = '' } = phrase;
    const card = document.createElement("div");
    card.classList.add("phrase-card");
    Object.assign(card.dataset,{ englishText: English, russianText: Russian, tatarText: Tatar });

    card.addEventListener('click', (e)=>{
        let text, lang;
        const type = e.target.closest('p').querySelector('strong').textContent.trim();

        if(type === 'English'){
            text = card.dataset.englishText;
            lang = 'en-US';
        } else if(type === 'Russian'){
            text = card.dataset.russianText;
            lang = 'ru-RU';
        } else if(type === 'Tatar'){
            text = tatToRus(card.dataset.tatarText);
            lang = 'ru-RU';
        } else{
            text = card.dataset.russianText;
        }
        speakText(text, lang);
    });
    
    card.innerHTML = `
      <p><strong>English</strong> ${English} <span class="translit">${EngTranslit}</span></p>
      <p><strong>Russian</strong> ${Russian} <span class="translit">${RusTranslit}</span></p>
      <p><strong>Tatar</strong> ${Tatar} <span class="translit">${TatTranslit}</span></p>
    `;
    phrasesContainer.appendChild(card);
    observer.observe(card);
  });
}

function showTopic(topic){
  showPhrases(mainData.phrasebook[topic]);
  searchInput.value = "";
}

function showTopics(topics){
  phrasebookTopicsNav.innerHTML = "";
  
  const backbutton = document.createElement("button");
  backbutton.textContent = "Back";
  backbutton.classList.add("menu-button", "back-to-home");
  backbutton.addEventListener("click", ()=> switchView('home-view', 'Phrasebook and Guide'));
  phrasebookTopicsNav.appendChild(backbutton);
  
  topics.forEach(topic=>{
    const button = document.createElement("button");
    button.textContent = topic;
    button.classList.add("menu-button");
    button.addEventListener("click", ()=> showTopic(topic));
    phrasebookTopicsNav.appendChild(button);
  });
}

searchInput.addEventListener("input", ()=>{
  const query = searchInput.value.toLowerCase();
  const results = [];
  Object.values(mainData.phrasebook).forEach(topic=>{ 
    topic.forEach(phrase=>{
      if (Object.values(phrase).join(" ").toLowerCase().includes(query)) results.push(phrase);
    });
  });
  showPhrases(results);
});

function showInfoCards(data, container){
    container.innerHTML = "";
    data.forEach(item=>{
        const card = document.createElement("div");
        card.classList.add("phrase-card");
        card.innerHTML = `<strong>${item.title}</strong><p>${item.text}</p>`;
        container.appendChild(card);
        observer.observe(card);
    });
}

document.querySelectorAll('.topic-button').forEach(button=>{
    button.addEventListener('click', ()=>{
        const{
          topicCategory: Category,
          topicName: Name
        } = button.dataset;
        if(Category === 'history'){
          var container = historyContainer;
        } else if(Category === 'culture'){
          var container = cultureContainer;
        } else if(Category === 'sights'){
          var container = sightsContainer;
        }
        showInfoCards(mainData[Category][Name], container);
    });
});