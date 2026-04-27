# GitHub Code Analyzer

Этот проект представляет из себя инструмент для анализа кодовой базы с помощью локально установленного ИИ codellama

## Установка
0. Скачайте codellama  
   https://ollama.com/ - установка ollama  
   Установка codellama:
   ```bash
   ollama pull codellama
   ```
2. Клонируйте данный репозиторий и бекенд веб-сервиса
   ```bash
   git clone https://github.com/gitPhoenixk/githubCodeAnalyzer.git
   cd githubCodeAnalyzer
   ```
   ```bash
   git clone https://github.com/gitPhoenixk/backend.git
   cd backend
   ```
3. (Для бекенда) Запустите виртуальное окружение и установите пакеты
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```
   ```bash
   pip install -r requirements.txt
   ```
4. Запустите веб сервис
   Бекенд:
   ```bash
   uvicorn main:app --reload
   ```
   Фронтенд:
   ```bash
   npm run dev
   ```

## Использование
1. Ввести ссылку на GitHub проект
2. Выбрать режим (целиком или функции)
3. Выбрать из списка файлов слева файл, который вы бы хотели просмотреть
4. Навестись на блок с кодом, чтобы получить его расшифровку

### Просмотр целиком
![Целиком](https://s10.iimage.su/s/27/gqG07PZxRmGD1ANCrLUftwUuvvb8Imi6QjPEOQDmh.jpg)

### Просмотр по функциям
![Функции](https://s10.iimage.su/s/27/gmiS1d7x8kcsjC9Jl2fKTevmX64RkkTXkzEslYaAg.jpg)
