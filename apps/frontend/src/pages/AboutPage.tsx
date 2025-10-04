import { useState } from 'react';
import { Link } from 'react-router-dom';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: 'Czym jest Czydojade?',
    answer: 'Czydojade to aplikacja, która pomaga w planowaniu podróży transportem publicznym w Małopolsce. Dostarczamy informacje w czasie rzeczywistym o opóźnieniach, zakłóceniach i problemach z tramwajami i autobusami, dzięki czemu możesz podejmować lepsze decyzje podróżne.'
  },
  {
    question: 'Jak to działa?',
    answer: 'Nasza aplikacja łączy dane na żywo z systemu TTSS z raportami użytkowników. Możesz zobaczyć aktualne pozycje pojazdów na mapie, otrzymywać powiadomienia o opóźnieniach i zgłaszać problemy, które napotkasz podczas podróży.'
  },
  {
    question: 'Jakie środki transportu są obsługiwane?',
    answer: 'Aktualnie obsługujemy tramwaje i autobusy w regionie Małopolska. W przyszłości planujemy rozszerzyć usługę o kolejne rodzaje transportu.'
  },
  {
    question: 'Czy mogę zgłaszać problemy?',
    answer: 'Tak! Możesz zgłaszać różne typy zakłóceń takie jak opóźnienia, odwołania, zatłoczenie czy problemy bezpieczeństwa. Twoje raporty pomagają innym użytkownikom i operatorom transportu.'
  },
  {
    question: 'Jak mogę otrzymywać powiadomienia?',
    answer: 'Możesz subskrybować wybrane linie, przystanki lub obszary. Otrzymasz powiadomienia o zakłóceniach w Twoich ulubionych trasach. Powiadomienia można dostosować do swoich potrzeb, w tym ustawić godziny ciszy (22:00-06:00).'
  },
  {
    question: 'Czy aplikacja jest bezpłatna?',
    answer: 'Tak, aplikacja jest całkowicie bezpłatna dla wszystkich użytkowników.'
  },
  {
    question: 'Jak zgłaszać problemy bezpieczeństwa?',
    answer: 'Dla zgłoszeń dotyczących bezpieczeństwa (np. niebezpieczne zachowanie, wandalizm) wymagamy weryfikacji SMS. Twoje zgłoszenie zostanie przeanalizowane przez społeczność i może być przekazane odpowiednim służbom.'
  },
  {
    question: 'Czy moje dane są bezpieczne?',
    answer: 'Tak. Przetwarzamy dane zgodnie z RODO. Przechowujemy tylko niezbędne informacje przez ograniczony czas. Możesz w każdej chwili wyeksportować lub usunąć swoje dane.'
  },
  {
    question: 'Czy mogę korzystać bez konta?',
    answer: 'Możesz przeglądać mapę i informacje o zakłóceniach bez konta. Do zgłaszania problemów i otrzymywania spersonalizowanych powiadomień potrzebne jest konto z weryfikacją SMS.'
  },
  {
    question: 'Jak mogę pomóc w rozwoju projektu?',
    answer: 'Zgłaszaj problemy dokładnie i uczciwie, potwierdzaj raporty innych użytkowników, gdy jesteś w tym samym miejscu, oraz dziel się opinią o aplikacji. Budujemy społeczność, która wzajemnie sobie pomaga!'
  }
];

export default function AboutPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-black pt-" >
      {/* About Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl sm:rounded-2xl shadow-2xl border border-gray-700 p-6 sm:p-8 md:p-10 mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6">
            Nasza Misja
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-400 leading-relaxed mb-4">
            Czydojade to platforma stworzona, aby ułatwić codzienne podróże transportem publicznym.
            Łączymy dane w czasie rzeczywistym z raportami społeczności, dostarczając aktualne
            i wiarygodne informacje o zakłóceniach w komunikacji miejskiej.
          </p>
          <p className="text-base sm:text-lg md:text-xl text-gray-400 leading-relaxed">
            Wierzymy, że dzięki współpracy użytkowników możemy stworzyć lepsze doświadczenie
            podróżowania dla wszystkich mieszkańców i gości Małopolski.
          </p>
        </div>

        {/* Key Features */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl sm:rounded-2xl shadow-2xl border border-gray-700 p-6 sm:p-8 hover:border-gray-600 hover:shadow-gray-900/50 transition-all duration-300 group">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
              Śledzenie na żywo
            </h3>
            <p className="text-sm sm:text-base md:text-lg text-gray-400 leading-relaxed">
              Zobacz pozycje tramwajów i autobusów w czasie rzeczywistym na interaktywnej mapie
            </p>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl sm:rounded-2xl shadow-2xl border border-gray-700 p-6 sm:p-8 hover:border-gray-600 hover:shadow-gray-900/50 transition-all duration-300 group">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
              Natychmiastowe powiadomienia
            </h3>
            <p className="text-sm sm:text-base md:text-lg text-gray-400 leading-relaxed">
              Otrzymuj alerty o opóźnieniach i zakłóceniach na Twoich ulubionych liniach
            </p>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl sm:rounded-2xl shadow-2xl border border-gray-700 p-6 sm:p-8 hover:border-gray-600 hover:shadow-gray-900/50 transition-all duration-300 group sm:col-span-2 md:col-span-1">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
             Raporty społeczności
            </h3>
            <p className="text-sm sm:text-base md:text-lg text-gray-400 leading-relaxed">
              Dziel się informacjami i pomagaj innym podróżnym w czasie rzeczywistym
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl sm:rounded-2xl shadow-2xl border border-gray-700 p-6 sm:p-8 md:p-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6 sm:mb-8">
            Najczęściej zadawane pytania
          </h2>

          <div className="space-y-3 sm:space-y-4">
            {faqData.map((faq, index) => (
              <div
                key={index}
                className="border border-gray-700 rounded-lg sm:rounded-xl overflow-hidden hover:border-gray-600 transition-all duration-200 bg-gray-800/50"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-4 sm:p-6 md:p-8 hover:bg-gray-800/80 transition-colors text-left"
                >
                  <span className="font-bold text-base sm:text-lg md:text-xl text-white pr-4 sm:pr-6">
                    {faq.question}
                  </span>
                  <svg
                    className={`w-5 h-5 sm:w-6 sm:h-6 text-gray-400 transition-transform flex-shrink-0 ${openIndex === index ? 'transform rotate-180' : ''
                      }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {openIndex === index && (
                  <div className="p-4 sm:p-6 md:p-8 bg-gray-900/50 border-t border-gray-700">
                    <p className="text-sm sm:text-base md:text-lg text-gray-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl sm:rounded-2xl shadow-2xl border border-gray-700 p-6 sm:p-8 md:p-10 mt-8 sm:mt-12">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-white">
              Masz więcej pytań?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-400 mb-6 sm:mb-8 leading-relaxed">
              Jeśli nie znalazłeś odpowiedzi na swoje pytanie, skontaktuj się z nami.
              Chętnie pomożemy!
            </p>
            <Link
              to="/"
              className="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-white text-black rounded-lg hover:bg-gray-200 transition-all duration-200 font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Rozpocznij korzystanie
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-black border-t border-gray-800 py-8 sm:py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm sm:text-base text-gray-400">© 2025 Czydojade. Wszystkie prawa zastrzeżone.</p>
          <p className="text-xs sm:text-sm mt-2 text-gray-500">Region Małopolska • Tramwaje i Autobusy</p>
        </div>
      </div>
    </div>
  );
}

