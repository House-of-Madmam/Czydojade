# Entities

- linia komunikacyjna (numer, typ - autobus, tramwaj)
- przystanek (nazwa, lat, lon, typ- autobusowy, tramwajowy)
- przystanek na linii (kolejność, linia, przystanek)
- incydent (opis optional, typ - awaria, niebezpieczeństwo, czas rozpoczęcia, czas zakonecznia opcjanalne, lokalizacja, priorytet, foreign key dla lini/przystanku)
- głosowanie (użytkownik id, incydent id, czas głosowania, typ - wystepuje, nie wystepuje)
- użytkownik (email, hasło, rola - user, admin)
- subskrypcja linii (id, użytkownik id, linia id, minimalny priorytet - niski/średni/wysoki/krytyczny, aktywna - true/false)
- subskrypcja obszaru (id, użytkownik id, lat, lon, promień w metrach, minimalny priorytet - niski/średni/wysoki/krytyczny, aktywna - true/false)

## Zasady walidacji (MVP)

- incydent MUSI mieć przypisaną ALBO linię ALBO przystanek (nie oba, nie żaden)
- głosowanie - użytkownik może zagłosować tylko raz na incydent
- subskrypcja linii/obszaru - użytkownik może mieć wiele subskrypcji
- incydent bez czasu zakończenia = aktywny incydent
- głosowanie z wartością -1 przy >= 5 głosach ujemnych = auto-zamknięcie incydentu (do rozważenia)

## TODO na później

- powiadomienia push dla subskrypcji, SNS lub inny mechanizm, dostarczanie w różnej formie (email, push, sms - do rozważenia)
- zamykanie, otwieranie incydentów przez admina
