let logMessages = [];
let typingTimeout = null;
let typedLength = 0;


const locations = ["Деревня Эльмир", "Лес Теней", "Заброшенный храм", "Пещера троллей", "Река Мёртвых", "Башня колдуна"];
const items = ["Зелье лечения", "Меч", "Щит", "Карта подземелья", "Магический кристалл"];
const shopItems = [
  { name: "Зелье лечения", price: 10, effect: () => healPlayer(30) },
  { name: "Меч", price: 50 },
  { name: "Щит", price: 40 }
];
const enemies = [
  { name: "Гоблин", hp: 30, attack: 5, reward: { exp: 10, gold: 5 } },
  { name: "Скелет", hp: 40, attack: 7, reward: { exp: 15, gold: 10 } },
  { name: "Тролль", hp: 60, attack: 10, reward: { exp: 20, gold: 15 } }
];
const quests = [
  { id: 1, title: "Победить гоблина", target: "Гоблин", targetCount: 1, reward: { gold: 20, items: ["Зелье лечения"] } },
  { id: 2, title: "Принести кристалл", target: null, targetCount: 0, reward: { gold: 10, items: ["Магический кристалл"] } }
];

let player = null;

// --- Логирование ---
function addLog(msg) {
  logMessages.push(msg);
  if (logMessages.length > 8) logMessages.shift();
  updateLog();
}

// Глобальная переменная для таймера печати (чтобы не накладывались вызовы)

function updateLog() {
  const logDiv = document.getElementById("log");
  if (!logDiv) return;

  if (typingTimeout) {
    clearTimeout(typingTimeout);
    typingTimeout = null;
  }

  const fullText = logMessages.join("\n");
  // начинаем печать с позиции typedLength
  let currentIndex = typedLength;

  function typeNext() {
    if (currentIndex <= fullText.length) {
      // Показываем весь уже напечатанный текст + часть новой
      logDiv.innerText = fullText.slice(0, currentIndex);
      logDiv.scrollTop = logDiv.scrollHeight;

      currentIndex++;

      if (currentIndex > typedLength) {
        typedLength = currentIndex;
      }

      if (currentIndex <= fullText.length) {
        typingTimeout = setTimeout(typeNext, 15);
      }
    }
  }

  typeNext();
}


// --- Сохранение и загрузка ---
function loadGame() {
  const saved = localStorage.getItem("player");
  return saved ? JSON.parse(saved) : null;
}

function saveGame() {
  localStorage.setItem("player", JSON.stringify(player));
}

// --- Старт: создание персонажа ---
function startGame() {
  logMessages = [];
  const screen = document.getElementById("screen");
  screen.innerHTML = `
    <h2>Создай персонажа</h2>
    <input id="name" placeholder="Имя героя" /><br><br>
    <select id="class">
      <option value="Воин">Воин</option>
      <option value="Маг">Маг</option>
      <option value="Разбойник">Разбойник</option>
    </select><br><br>
    <button id="createBtn">Создать</button>
    <div id="log" style="
      height: 140px; overflow-y: auto; background: rgba(0,0,0,0.75);
      color: #f0e6d2; padding: 10px; border-radius: 8px; margin-top: 20px;
      font-family: monospace; font-size: 14px; white-space: pre-wrap;"></div>
  `;
  document.getElementById("createBtn").onclick = createCharacter;
  updateLog();
}

// --- Создание персонажа ---
function createCharacter() {
  const name = document.getElementById("name").value.trim();
  if (!name) {
    alert("Введите имя героя!");
    return;
  }
  const charClass = document.getElementById("class").value;

  player = {
    name,
    class: charClass,
    hp: 100,
    inventory: [],
    location: "Деревня Эльмир",
    quest: null,
    exp: 0,
    gold: 0,
    level: 1,
    equipment: { weapon: null, armor: null }
  };

  saveGame();
  addLog(`Создан персонаж ${player.name} (${player.class})`);
  showMainScreen();
}

// --- Главный экран ---
function showMainScreen() {
  player = loadGame();
  if (!player) {
    startGame();
    return;
  }
  const screen = document.getElementById("screen");

  const questText = player.quest
    ? `Задание: ${player.quest.title} (Прогресс: ${player.quest.progress || 0}/${player.quest.targetCount})`
    : "Задание отсутствует";

  screen.innerHTML = `
    <div id="player-info">
      <h2>${player.name} (${player.class})</h2>
      <p>Уровень: ${player.level}</p>
      <p>HP: ${player.hp} | Exp: ${player.exp} | 💰: ${player.gold}</p>
      <p>Оружие: ${player.equipment.weapon || "нет"} | Броня: ${player.equipment.armor || "нет"}</p>
      <p>Локация: ${player.location}</p>
      <p>${questText}</p>
    </div>
    <div id="log" style="
      height: 140px; overflow-y: auto; background: rgba(0,0,0,0.75);
      color: #f0e6d2; padding: 10px; border-radius: 8px; margin: 10px 0;
      font-family: monospace; font-size: 14px; white-space: pre-wrap;"></div>
    <div id="actions" style="margin-top: 10px;"></div>
  `;

  updateLog();

  // Кнопки
  const actions = [
    { text: "Осмотреться", handler: explore },
    { text: "Инвентарь", handler: showInventory },
    { text: "Битва", handler: startBattle },
    { text: "Задание", handler: getQuest },
    { text: "Магазин", handler: openShop },
    { text: "Карта", handler: openMap },
    { text: "Сбросить", handler: resetGame }
  ];
  showActions(actions);
}

// --- Показать кнопки ---
function showActions(actions) {
  const actionsDiv = document.getElementById("actions");
  if (!actionsDiv) {
    console.error("Нет контейнера #actions для кнопок!");
    return;
  }
  actionsDiv.innerHTML = "";
  actions.forEach(action => {
    const btn = document.createElement("button");
    btn.innerText = action.text;
    btn.onclick = action.handler;
    btn.style.margin = "5px";
    actionsDiv.appendChild(btn);
  });
}

// --- Исследовать ---
function explore() {
  const loc = locations[Math.floor(Math.random() * locations.length)];
  player.location = loc;
  addLog(`Вы прибыли в ${loc}`);
  if (Math.random() > 0.7) {
    const item = items[Math.floor(Math.random() * items.length)];
    player.inventory.push(item);
    addLog(`Вы нашли ${item}`);
  }
  saveGame();
  showMainScreen();
}

// --- Показать инвентарь ---
function showInventory() {
  const screen = document.getElementById("screen");

  if (player.inventory.length === 0) {
    addLog("Инвентарь пуст.");
    showMainScreen();
    return;
  }

  let invHTML = `
    <h2>Инвентарь</h2>
    <div id="log" style="
      height: 140px; overflow-y: auto; background: rgba(0,0,0,0.75);
      color: #f0e6d2; padding: 10px; border-radius: 8px; margin: 10px 0;
      font-family: monospace; font-size: 14px; white-space: pre-wrap;">${logMessages.join("\n")}</div>
    <ul style="list-style:none; padding-left:0;">
  `;

  player.inventory.forEach((item, i) => {
    invHTML += `<li style="margin-bottom: 8px;">
      ${item} 
      <button onclick="useItem(${i})">Использовать</button>
    </li>`;
  });

  invHTML += `</ul><button onclick="showMainScreen()">Назад</button>`;

  screen.innerHTML = invHTML;
}

// --- Использовать предмет ---
function useItem(index) {
  const item = player.inventory[index];
  if (!item) {
    addLog("Неверный предмет");
    showInventory();
    return;
  }

  if (item === "Зелье лечения") {
    player.hp = Math.min(player.hp + 30, 100);
    addLog("Вы использовали зелье и восстановили 30 HP");
    player.inventory.splice(index, 1);
  } else if (item === "Меч" || item === "Щит") {
    if (item === "Меч") player.equipment.weapon = item;
    if (item === "Щит") player.equipment.armor = item;
    addLog(`Вы экипировали ${item}`);
    player.inventory.splice(index, 1);
  } else {
    addLog("Этот предмет нельзя использовать.");
  }

  saveGame();
  showInventory();
}

// --- Начать битву ---
function startBattle() {
  const enemy = JSON.parse(JSON.stringify(enemies[Math.floor(Math.random() * enemies.length)]));
  addLog(`Вы встретили ${enemy.name}!`);

  let weaponBonus = player.equipment.weapon === "Меч" ? 5 : 0;
  let armorBonus = player.equipment.armor === "Щит" ? 3 : 0;

  function battleStep() {
    if (enemy.hp <= 0) {
      addLog(`Вы победили ${enemy.name}! +${enemy.reward.exp} опыта, +${enemy.reward.gold} монет`);
      player.exp += enemy.reward.exp;
      player.gold += enemy.reward.gold;

      const expToLevel = player.level * 100;
      if (player.exp >= expToLevel) {
        player.level++;
        player.exp -= expToLevel;
        player.hp = 100;
        addLog(`Поздравляем! Вы достигли уровня ${player.level}! HP восстановлено.`);
      }

      if (player.quest && player.quest.target === enemy.name) {
        player.quest.progress = (player.quest.progress || 0) + 1;
        if (player.quest.progress >= player.quest.targetCount) {
          addLog("Задание выполнено! Получена награда.");
          player.gold += player.quest.reward.gold || 0;
          if (player.quest.reward.items) player.inventory.push(...player.quest.reward.items);
          player.quest = null;
        } else {
          addLog(`Прогресс задания: ${player.quest.progress} / ${player.quest.targetCount}`);
        }
      }

      saveGame();
      showMainScreen();
      return;
    }

    if (player.hp <= 0) {
      addLog("Вы проиграли... Игра окончена.");
      localStorage.removeItem("player");
      startGame();
      return;
    }

    enemy.hp -= 15 + weaponBonus;
    addLog(`Вы ударили ${enemy.name}, его HP: ${Math.max(enemy.hp, 0)}`);

    if (enemy.hp > 0) {
      player.hp -= Math.max(0, enemy.attack - armorBonus);
      addLog(`${enemy.name} атакует вас. Ваш HP: ${Math.max(player.hp, 0)}`);
    }

    saveGame();
    setTimeout(battleStep, 800);
  }

  battleStep();
}

// --- Получить задание ---
function getQuest() {
  if (player.quest) {
    addLog("У вас уже есть задание.");
    showMainScreen();
    return;
  }
  const quest = quests[Math.floor(Math.random() * quests.length)];
  player.quest = { ...quest, progress: 0 };
  addLog(`Новое задание: ${quest.title}`);
  saveGame();
  showMainScreen();
}

// --- Магазин с покупкой ---
function openShop() {
  const screen = document.getElementById("screen");
  let shopHTML = `
    <h2>Магазин</h2>
    <div id="log" style="
      height: 140px; overflow-y: auto; background: rgba(0,0,0,0.75);
      color: #f0e6d2; padding: 10px; border-radius: 8px; margin: 10px 0;
      font-family: monospace; font-size: 14px; white-space: pre-wrap;">${logMessages.join("\n")}</div>
    <ul style="list-style:none; padding-left:0;">
  `;

  shopItems.forEach((item, i) => {
    shopHTML += `<li style="margin-bottom: 8px;">
      ${item.name} — ${item.price} монет 
      <button onclick="buyItem(${i})">Купить</button>
    </li>`;
  });

  shopHTML += `</ul><button onclick="showMainScreen()">Назад</button>`;

  screen.innerHTML = shopHTML;
}

// --- Купить предмет ---
function buyItem(index) {
  const item = shopItems[index];
  if (player.gold >= item.price) {
    player.gold -= item.price;
    player.inventory.push(item.name);
    addLog(`Вы купили ${item.name}`);
  } else {
    addLog("Недостаточно монет.");
  }
  saveGame();
  openShop();
}

// --- Открыть карту ---
function openMap() {
  addLog("Доступные локации:");
  locations.forEach((loc, i) => addLog(`${i + 1}) ${loc}`));
  updateLog();
}

// --- Лечение ---
function healPlayer(amount) {
  player.hp = Math.min(player.hp + amount, 100);
  addLog(`Вы восстановили ${amount} HP`);
  saveGame();
}

// --- Сброс ---
function resetGame() {
  if (confirm("Сбросить игру?")) {
    localStorage.removeItem("player");
    location.reload();
  }
}

function openMap() {
  const screen = document.getElementById("screen");

  let mapHTML = `
    <h2>Карта</h2>
    <div id="log" style="
      height: 140px;
      overflow-y: auto;
      background: rgba(0,0,0,0.75);
      color: #f0e6d2;
      padding: 10px;
      border-radius: 8px;
      margin: 10px 0;
      font-family: monospace;
      font-size: 14px;
      white-space: pre-wrap;"></div>
    <ul style="list-style:none; padding:0;">
  `;

  locations.forEach((loc, i) => {
    mapHTML += `<li style="margin-bottom: 8px;">
      ${i + 1}) ${loc} 
      <button onclick="travelTo(${i})">Перейти</button>
    </li>`;
  });

  mapHTML += `</ul><button onclick="showMainScreen()">Назад</button>`;

  screen.innerHTML = mapHTML;

 function travelTo(index) {
  if (!player) return;
  player.location = locations[index];
  addLog(`Вы переместились в ${player.location}`);
  saveGame();
  showMainScreen();

  }
}




// --- Загрузка при старте страницы ---
window.onload = () => {
  player = loadGame();
  if (player) {
    addLog(`Добро пожаловать, ${player.name}`);
    showMainScreen();
  } else {
    startGame();
  }
};
