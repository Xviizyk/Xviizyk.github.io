const $ = id => document.getElementById(id);
const themeButton = $("toggle-theme");
const pageTitle = $("page-title");
const searchInput = $("search-input");
const phrasesContainer = $("phrases-container");
const sightsContainer = $("sights-container");
const cultureContainer = $("culture-container");
const historyContainer = $("history-container");
const allViews = document.querySelectorAll('.view');

const mainData = {};

function tatToRus(tatarText) {
    const replaces = {
        'Ә': 'Э', 'ә': 'э', 'Ө': 'О', 'ө': 'ё', 'Ү': 'У', 'ү': 'у',
        'Җ': 'Ж', 'җ': 'ж', 'Ң': 'Н', 'ң': 'н', 'Һ': 'Х', 'һ': 'х',
        'Қ': 'К', 'қ': 'к', 'Ч': 'Щ', 'ч': 'щ', 'Й': 'иъ', 'й': 'иъ',
        'Лл': 'Л', 'лл': 'л', 'Л': 'Ль', 'л': 'ль',
    };
    let normalizedText = tatarText;
    for (const [tatarChar, russianChar] of Object.entries(replaces)) {
        normalizedText = normalizedText.replace(new RegExp(tatarChar, 'g'), russianChar);
    }
    return normalizedText;
}

function speakText(text, language) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith(language.substring(0, 2)));

    if (voice) utterance.voice = voice;
    else utterance.lang = language;

    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
}

fetch("data/data.json")
    .then(res => res.ok ? res.json() : null)
    .then(json => {
        if (json) {
            Object.assign(mainData, json);
            mainData.phrasebook = mainData.phrasebook || mainData.phrases;
            renderPhrasebookTopics();
        }
    })
    .catch(err => console.error("Error loading a JSON:", err));

themeButton.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    themeButton.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
});

function switchView(viewId, title) {
    allViews.forEach(view => view.style.display = 'none');
    $(viewId).style.display = 'block';
    pageTitle.textContent = title;
}

document.querySelectorAll('#home-view .menu-button').forEach(button => {
    button.addEventListener('click', () => {
        const viewId = button.dataset.view;
        switchView(viewId, button.textContent);
        if (viewId === 'phrasebook-view' && mainData.phrasebook) {
            const firstTopic = Object.keys(mainData.phrasebook)[0];
            showTopic(firstTopic);
        }
    });
});

document.querySelectorAll('.back-to-home').forEach(button => {
    button.addEventListener('click', () => switchView('home-view', 'Phrasebook and Guide'));
});

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

function showPhrases(phrases) {
    phrasesContainer.innerHTML = "";
    if (!phrases) return;

    phrases.forEach(phrase => {
        const { English, Russian, Tatar, EnglishTranscripciya: EngT = '', RussianTranscripciya: RusT = '', TatarTranscripciya: TatT = '' } = phrase;
        const card = document.createElement("div");
        card.classList.add("phrase-card");

        card.innerHTML = `
            <p class="speak-btn" data-lang="en-US" data-text="${English}"><strong>English:</strong> ${English} <span class="translit">${EngT}</span></p>
            <p class="speak-btn" data-lang="ru-RU" data-text="${Russian}"><strong>Russian:</strong> ${Russian} <span class="translit">${RusT}</span></p>
            <p class="speak-btn" data-lang="tat" data-text="${Tatar}"><strong>Tatar:</strong> ${Tatar} <span class="translit">${TatT}</span></p>
        `;
        card.querySelectorAll('.speak-btn').forEach(p => {
            p.addEventListener('click', () => {
                let text = p.dataset.text;
                let lang = p.dataset.lang;
                if (lang === 'tat') {
                    text = tatToRus(text);
                    lang = 'ru-RU';
                }
                speakText(text, lang);
            });
        });

        phrasesContainer.appendChild(card);
        observer.observe(card);
    });
}

function renderPhrasebookTopics() {
    const nav = document.querySelector("#phrasebook-view nav");
    if (!nav || !mainData.phrasebook) return;

    nav.innerHTML = '<button class="menu-button back-to-home">Back</button>';
    nav.querySelector('.back-to-home').addEventListener('click', () => switchView('home-view', 'The Tatarstan Bridge'));

    Object.keys(mainData.phrasebook).forEach(topic => {
        const btn = document.createElement("button");
        btn.className = "menu-button";
        btn.textContent = topic;
        btn.onclick = () => showTopic(topic);
        nav.appendChild(btn);
    });
}

function showTopic(topic) {
    showPhrases(mainData.phrasebook[topic]);
    searchInput.value = "";
}

searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    const results = [];
    Object.values(mainData.phrasebook).forEach(topicPhrases => {
        topicPhrases.forEach(p => {
            if (JSON.stringify(p).toLowerCase().includes(query)) results.push(p);
        });
    });
    showPhrases(results);
});

function showInfoCards(data, container) {
    container.innerHTML = "";
    if (!data) {
        container.innerHTML = "<p>Sorry, there isn't any information.</p>";
        return;
    }
    data.forEach(item => {
        const card = document.createElement("div");
        card.classList.add("phrase-card");
        card.innerHTML = `<h3>${item.title}</h3><p>${item.text}</p>`;
        container.appendChild(card);
        observer.observe(card);
    });
}

document.querySelectorAll('.topic-button').forEach(button => {
    button.addEventListener('click', () => {
        const category = button.dataset.topicCategory;
        const name = button.dataset.topicName;
        
        let container;
        if (category === 'history') container = historyContainer;
        else if (category === 'culture') container = cultureContainer;
        else if (category === 'sights') container = sightsContainer;

        if (mainData[category] && mainData[category][name]) {
            showInfoCards(mainData[category][name], container);
        }
    });
});

const translatorInput = $("translator-input");
const translateBtn = $("translate-btn");
const translatorResult = $("translator-result");
const langSelect = $("lang-select");
async function translateText() {
    const text = translatorInput.value.trim();
    const langPair = langSelect.value;
    const [from, to] = langPair.split('|');

    if (!text) {
        translatorResult.textContent = "Please, write any text...";
        return;
    }

    translatorResult.textContent = "Translating...";

    try {
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`);
        const data = await response.json();

        if (data.responseData) {
            const translatedText = data.responseData.translatedText;
            translatorResult.innerHTML = `<strong>Result:</strong><br>${translatedText}`;
            const voiceBtn = document.createElement('button');
            voiceBtn.textContent = "🔊 Hear a result";
            voiceBtn.className = "menu-button";
            voiceBtn.style.marginTop = "10px";
            voiceBtn.style.width = "100%";

            voiceBtn.onclick = () => {
                let speechText = translatedText;
                let speechLang = 'ru-RU';

                if (to === 'tt') {
                    speechText = tatToRus(translatedText);
                    speechLang = 'ru-RU';
                } else if (to === 'en') {
                    speechLang = 'en-US';
                } else if (to === 'ru') {
                    speechLang = 'ru-RU';
                }
                
                speakText(speechText, speechLang);
            };
            
            translatorResult.appendChild(voiceBtn);
        } else {
            translatorResult.textContent = "Error of translating. Please try again later.";
        }
    } catch (error) {
        console.error("Translation error:", error);
        translatorResult.textContent = "Service is not responcible.";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const translateBtn = document.getElementById("translate-btn");
    if (translateBtn) {
        translateBtn.addEventListener("click", translateText);
    }
});
