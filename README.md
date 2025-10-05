# 🚋 CzyDojade – sprawdź, czy dojedziesz!  

**CzyDojade** to społecznościowa platforma 🚦 do zgłaszania incydentów w komunikacji miejskiej w czasie rzeczywistym. Dzięki niej pasażerowie mogą **ostrzegać się nawzajem** i szybciej reagować na problemy.  

Demo: https://www.youtube.com/watch?v=zQZRO522nz4

## 🔔 Co możesz zgłaszać?  
- 🚍 **Awarie pojazdów** – np. zepsuty tramwaj, autobus z otwartymi drzwiami  
- 🛠️ **Awarie infrastruktury** – uszkodzony przystanek, zerwana sieć trakcyjna  
- ⚠️ **Niebezpieczeństwa** – agresywni pasażerowie, podejrzane zachowania  

## 📍 Jak to działa?  
- ✅ Społeczność potwierdza lub odrzuca zgłoszenia głosując  
- 🗺️ Interaktywna mapa pokazuje aktywne incydenty  
- 🔔 Subskrybujesz linie/obszary i dostajesz **spersonalizowane alerty**  

## 👩‍💻 Przykłady użycia:  
- Widzisz awarię tramwaju? 👉 Zgłoś i ostrzeż innych  
- Planujesz dojazd? 👉 Sprawdź mapę incydentów i wybierz lepszą trasę  
- Czujesz zagrożenie w autobusie? 👉 Oznacz lokalizację i powiadom pasażerów  
- Jeździsz codziennie tą samą linią? 👉 Subskrybuj i dostawaj powiadomienia  

---

🚀 **CzyDojade** sprawia, że codzienny dojazd jest bezpieczniejszy, szybszy i mniej stresujący.

## Authors
- Arya Ravi
- Diana Górska
- Andrzej Fiedler
- Michał Szczygieł
- Michał Cieślar
- Michał Matoga

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Build apps:

   ```bash
   npm run build
   ```

3. Lint code:

   ```bash
   npm run lint
   ```

4. Start services with Docker Compose:

   ```bash
   docker compose up -d
   ```

5. Run tests

    ```bash
    npm run test
    ```

6. Run database migrations (if you ran tests before, you can skip this step because the test setup already runs migrations):

   ```bash
   cd apps/backend
   export DATABASE_URL=postgres://postgres:postgres@localhost:5432/czydojade
   npm run db:push
   ```

7. Start frontend app (in a new terminal):

   ```bash
   cd apps/frontend
   npm run dev
   ```

8. Start backend app (in a new terminal):

   ```bash
   cd apps/backend
   npm run dev
   ```
