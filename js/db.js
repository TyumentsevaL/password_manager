// Ищем в разметке html-элемент form
const formElement = document.querySelector('form');
// Ищем в разметке html-элемент с контейнером для сохраненных паролей
const passwordsElement = document.querySelector('div.passwords-container');
// Ищем в разметке html-элемент с кнопкой "Сохранить"
const submitButton = formElement.querySelector('button[type=submit]');
// Константа для хранилища паролей
const storeName = "passwords"

// Открываем IndexedDB с двумя параметрами name и version
const openRequest = indexedDB.open("passwords-db", 1);

// Обработчик для события onupgradeneeded. Срабатывает, если на клиенте нет базы данных
openRequest.onupgradeneeded = () => {
    // получаем инстенс БД
    const db = openRequest.result;
    // если хранилище не существует, то создаём хранилище
    if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, {keyPath: 'id', autoIncrement: true});
    }
};

// Обработчик для события onerror. Срабатывает, если не удалось открыть базу данных
openRequest.onerror = () => {
    //Логируем ошибку
    console.error("Error", openRequest.error);
    //Скрываем форму для отправки паролей
    formElement.classList.replace("visible", "invisible");
};

// Обработчик для события onsuccess. Срабатывает, если удалось открыть базу данных
openRequest.onsuccess = () => {
    //Логируем что смогли подключиться с БД
    console.log("Подключились к БД", openRequest.success);
    // получаем инстенс БД
    const db = openRequest.result;
    // продолжить работу с базой данных, используя объект db
    // показываем форму для отправки паролей на случай, если она была скрыта
    formElement.classList.replace("invisible", "visible");

    // добавляем обработчик для отправки формы
    formElement.addEventListener("submit", ev => {
        // Предотвращаем событие отправки формы на сервер, т.к. обработка будет локальной
        ev.preventDefault();
        // Делаем кнопку отправки недоступной, чтобы предотвратить многократное нажатие
        submitButton.disabled = true;
        // Создаем объект FormData из данных в теге form
        const formData = new FormData(ev.target);
        // Создаем объект с данными для сохранения в бд
        const passwordItem = Object.fromEntries(formData);
        // Сохраняем данные в БД
        storeDataInDb(db, passwordItem)
    })

    // Показываем сохраненные пароли из БД
    showSavedPasswords(db)
};

/**
 * Сохранить данные в БД
 * @param db открытая база данных
 * @param passwordItem значение для сохранения с полями site, login, password
 */
function storeDataInDb(db, passwordItem) {
    // Создаем транзакцию для чтения и записи
    const transaction = db.transaction(storeName, "readwrite");

    // Получаем хранилище объектов
    const passwordsStore = transaction.objectStore(storeName);

    //Выполняем запрос на добавление элемента в хранилище объектов
    const request = passwordsStore.add(passwordItem);

    //Обработчик onsuccess для запроса вставки
    request.onsuccess = () => {
        const message = "Данные добавлены в хранилище";
        console.log(message, request.result);
        //Сбрасываем введенные значения в форме
        formElement.reset()
        //Делаем кнопку отправки снова доступной
        submitButton.disabled = false;
        // Отображаем данные на странице
        drawItem(passwordItem)
    };

    //Обработчик onerror для запроса вставки. Возникает если не удалось сохранить пароль
    request.onerror = () => {
        const message = "Не удалось сохранить данные в хранилище";
        console.log(message, request.error);
    };
}

/**
 * Показать сохранные пароли
 * @param db открытая БД
 */
function showSavedPasswords(db) {
    // Создаем транзакцию для чтения
    const transaction = db.transaction(storeName, "readonly"); // (1)

    // Получаем хранилище объектов
    const passwordsStore = transaction.objectStore(storeName); // (2)

    //Выполняем запрос на получение всех элементов в хранилище объектов
    const request = passwordsStore.getAll();

    //Обработчик onsuccess для запроса получения всех паролей
    request.onsuccess = () => {
        //Получаем все пароли
        const items = request.result;
        // В цикле отрисовываем каждый пароль на странице
        items.forEach(item => drawItem(item))
    };

    //Обработчик onerror для запроса получения всех паролей. Возникает если не удалось получить все пароли
    request.onerror = () => {
        const message = "Не удалось получить данные из хранилища";
        // Логируем ошибку
        console.log(message, request.error);
    };
}

/**
 * Добавляем элемент с информацией по паролю на страницу
 * @param item Информация по паролю с полями site, login, password
 */
function drawItem(item) {
    // Создаем контейнер для элемента с паролями
    const card = document.createElement("div");
    //Добавляем класс к html-элементу
    card.classList.add("card", "col-4", "m-1");
    // Создаем контейнер для элемента с паролями
    const container = document.createElement("div");
    //Добавляем класс к html-элементу
    container.classList.add("row");

    card.appendChild(container);

    // Добавляем информацию о сайте
    appendItemValue(container, "Сайт", item.site, "text")
    // Добавляем информацию о логине
    appendItemValue(container, "Логин", item.login, "text")
    // Добавляем информацию о пароле
    appendItemValue(container, "Пароль", item.password, "password")

    // Добавляем в контейнер для всех паролей новый элемент с паролями
    passwordsElement.append(card)
}

/**
 * Добавить элемент с информацией о пароле
 * @param parentElement родительский элемент, куда будет добавлена информация о пароле
 * @param labelText Текст для label
 * @param value Значение
 * @param valueType Тип для input. Возможные значения text и password
 */
function appendItemValue(parentElement, labelText, value, valueType) {
    // Создаем label
    const label = document.createElement("label");
    // Добавляем классы к label
    label.classList.add("col-sm-3", "col-form-label", "fw-bold");
    // Устанавливаем текст для label
    label.textContent = labelText;

    const group = document.createElement("div");
    group.classList.add("col-sm-9");

    // Создаем элемент для значения
    const input = document.createElement("input");
    // Добавляем классы к input
    input.classList.add("form-control-plaintext");
    // Устанавливаем тип у input
    input.type = valueType;
    // Устанавливаем значение для input
    input.value = value;
    // Помечаем input readOnly, чтобы его нельзя было редактировать
    input.readOnly = true

    group.append(input);

    // Если тип для input = password, то тогда добавляем кнопку показать пароль
    if (valueType === "password") {
        //Создаем элемент кнопки
        const button = document.createElement("button");
        button.classList.add("btn", "btn-info", "mb-2");
        //Константа с текстом для кнопки
        const showPasswordText = "Показать пароль";
        button.textContent = showPasswordText;
        //Добавляем обработчик для нажатия на кнопку
        button.addEventListener('click', () => {
            // Если текущий тип input = password(т.е пароль скрыт), то меняем тип input на текст,
            // чтобы показать пароль. И меняем текст на кнопке
            if (input.type === "password") {
                button.textContent = "Скрыть пароль"
                input.type = "text";
            } else {
                // Иначе скрываем пароль
                input.type = "password";
                button.textContent = showPasswordText
            }
        })

        group.append(button);
    }

    //Добавляем label и значение в родительский элемент
    parentElement.append(label, group);
}