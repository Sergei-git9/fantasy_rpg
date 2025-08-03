const locations = [
    "Деревня Эльмир", "Лес Теней", "Заброшенный храм", "Пещера троллей", "Река Мёртвых", "Башня колдуна"
];

const items = ["Зелье лечения", "Меч", "Щит", "Карта подземелья", "Магический кристалл"];

const shopItems = [
    { name: "Зелье лечения", price: 10, effect: () => healPlayer(30) }
];

const enemies = [
    { name: "Гоблин", hp: 30, attack: 5, reward: { exp: 10, gold: 5 } },
    { name: "Скелет", hp: 40, attack: 7, reward: { exp: 15, gold: 10 } },
    { name: "Тролль", hp: 60, attack: 10, reward: { exp: 20, gold: 15 } },
    { name: "Орк", hp: 50, attack: 8, reward: { exp: 18, gold: 12 } },
    { name: "Темный маг", hp: 45, attack: 9, reward: { exp: 22, gold: 18 } },
    { name: "Волк", hp: 35, attack: 6, reward: { exp: 12, gold: 6 } }
];

// Задания с целями и наградами
const quests = [
    {
        id: 1,
        title: "Победить гоблина",
        target: "Гоблин",
        targetCount: 1,
        reward: { gold: 20, items: ["Зелье лечения"] }
    },
    {
        id: 2,
        title: "Принести кристалл",
        target: null,
        targetCount: 0,
        reward: { gold: 10, items: ["Магический кристалл"] }
    }
];

function startGame() {
    const screen = document.getElementById("screen");
    screen.innerHTML = `
        <h2>Создай персонажа</h2>
        <input type="text" id="name" placeholder="Имя героя"><br><br>
        <select id="class">
            <option value="Воин">Воин</option>
            <option value="Маг">Маг</option>
            <option value="Разбойник">Разбойник</option>
        </select><br><br>
        <button onclick="createCharacter()">Создать</button>
    `;
}

function createCharacter() {
    const name = document.getElementById("name").value;
    const charClass = document.getElementById("class").value;
    if (!name) {
        alert("Введите имя!");
        return;
    }
    const player = {
        name: name,
        class: charClass,
        hp: 100,
        inventory: [],
        location: "Деревня Эльмир",
        quest: null,
        exp: 0,
        gold: 0
    };
    localStorage.setItem("player", JSON.stringify(player));
    showMainScreen();
}

function showMainScreen() {
    const player = JSON.parse(localStorage.getItem("player"));
    const screen = document.getElementById("screen");
    let questText = player.quest ? `<p>Задание: ${player.quest.title} (Прогресс: ${player.quest.progress || 0}/${player.quest.targetCount})</p>` : "";
    screen.innerHTML = `
        <h2>${player.name} (${player.class})</h2>
        <p>HP: ${player.hp} | Exp: ${player.exp} | 💰: ${player.gold}</p>
        <p>Локация: ${player.location}</p>
        ${questText}
        <button onclick="explore()">Осмотреться</button>
        <button onclick="showInventory()">Инвентарь</button>
        <button onclick="startBattle()">Битва</button>
        <button onclick="getQuest()">Задание</button>
        <button onclick="openShop()">Магазин</button>
        <button onclick="openMap()">Карта</button>
        <button onclick="resetGame()">Сбросить</button>
    `;
}

function explore() {
    const player = JSON.parse(localStorage.getItem("player"));
    const newLocation = locations[Math.floor(Math.random() * locations.length)];
    player.location = newLocation;
    if (Math.random() > 0.7) {
        const foundItem = items[Math.floor(Math.random() * items.length)];
        player.inventory.push(foundItem);
        alert(`Вы нашли ${foundItem} в ${newLocation}`);
    } else {
        alert(`Вы прибыли в ${newLocation}`);
    }
    localStorage.setItem("player", JSON.stringify(player));
    showMainScreen();
}

function showInventory() {
    const player = JSON.parse(localStorage.getItem("player"));
    if (player.inventory.length) {
        let content = "Ваш инвентарь:\n";
        player.inventory.forEach((item, i) => {
            content += `${i + 1}) ${item}\n`;
        });
        const use = confirm(content + "\nХотите использовать зелье лечения?");
        if (use && player.inventory.includes("Зелье лечения")) {
            player.inventory.splice(player.inventory.indexOf("Зелье лечения"), 1);
            player.hp = Math.min(player.hp + 30, 100);
            alert("Вы использовали зелье. HP восстановлено.");
        }
    } else {
        alert("Инвентарь пуст.");
    }
    localStorage.setItem("player", JSON.stringify(player));
    showMainScreen();
}

function startBattle() {
    const enemy = JSON.parse(JSON.stringify(enemies[Math.floor(Math.random() * enemies.length)]));
    const player = JSON.parse(localStorage.getItem("player"));
    let battleLog = `Вы встретили ${enemy.name}!\n`;
    while (enemy.hp > 0 && player.hp > 0) {
        enemy.hp -= 15;
        player.hp -= enemy.attack;
        battleLog += `Вы ударили ${enemy.name}, его HP: ${enemy.hp}\n`;
        battleLog += `${enemy.name} атакует вас. Ваш HP: ${player.hp}\n`;
    }
    if (player.hp > 0) {
        battleLog += `Вы победили ${enemy.name}!\n+${enemy.reward.exp} опыта, +${enemy.reward.gold} монет`;
        player.exp += enemy.reward.exp;
        player.gold += enemy.reward.gold;

        // Проверка и обновление задания
        if (player.quest && player.quest.target === enemy.name) {
            player.quest.progress = (player.quest.progress || 0) + 1;
            if (player.quest.progress >= player.quest.targetCount) {
                battleLog += "\nЗадание выполнено! Награда получена.";
                player.gold += player.quest.reward.gold || 0;
                if (player.quest.reward.items) {
                    player.inventory.push(...player.quest.reward.items);
                }
                player.quest = null; // снимаем задание
            } else {
                battleLog += `\nПрогресс задания: ${player.quest.progress} из ${player.quest.targetCount}`;
            }
        }
    } else {
        battleLog += "Вы проиграли... игра окончена.";
        localStorage.removeItem("player");
        alert(battleLog);
        location.reload();
        return;
    }
    alert(battleLog);
    localStorage.setItem("player", JSON.stringify(player));
    showMainScreen();
}

function getQuest() {
    const player = JSON.parse(localStorage.getItem("player"));
    if (player.quest) {
        alert(`У вас уже есть задание: ${player.quest.title}`);
        return;
    }
    const quest = quests[Math.floor(Math.random() * quests.length)];
    player.quest = {
        id: quest.id,
        title: quest.title,
        target: quest.target,
        targetCount: quest.targetCount,
        reward: quest.reward,
        progress: 0
    };
    alert(`Новое задание: ${quest.title}. Награда: золото ${quest.reward.gold}, предметы: ${quest.reward.items ? quest.reward.items.join(", ") : "нет"}`);
    localStorage.setItem("player", JSON.stringify(player));
    showMainScreen();
}

function openShop() {
    const player = JSON.parse(localStorage.getItem("player"));
    let shopText = "Добро пожаловать в магазин:\n";
    shopItems.forEach((item, index) => {
        shopText += `${index + 1}) ${item.name} - ${item.price} монет\n`;
    });
    const choice = prompt(shopText + "Введите номер товара для покупки:");
    const selected = shopItems[parseInt(choice) - 1];
    if (selected && player.gold >= selected.price) {
        player.gold -= selected.price;
        player.inventory.push(selected.name);
        alert(`Вы купили ${selected.name}`);
    } else {
        alert("Недостаточно монет или неверный выбор.");
    }
    localStorage.setItem("player", JSON.stringify(player));
    showMainScreen();
}

function openMap() {
    const player = JSON.parse(localStorage.getItem("player"));
    let mapText = "Выберите локацию для перемещения:\n";
    locations.forEach((loc, i) => {
        mapText += `${i + 1}) ${loc}\n`;
    });
    const choice = prompt(mapText + "Введите номер локации:");
    const selected = locations[parseInt(choice) - 1];
    if (selected) {
        player.location = selected;
        alert(`Вы отправились в ${selected}`);
        localStorage.setItem("player", JSON.stringify(player));
    } else {
        alert("Неверный выбор.");
    }
    showMainScreen();
}

function healPlayer(amount) {
    const player = JSON.parse(localStorage.getItem("player"));
    player.hp = Math.min(player.hp + amount, 100);
    alert(`Вы восстановили ${amount} HP!`);
    localStorage.setItem("player", JSON.stringify(player));
}

function resetGame() {
    localStorage.removeItem("player");
    location.reload();
}

window.onload = () => {
    if (localStorage.getItem("player")) {
        showMainScreen();
    }
};
