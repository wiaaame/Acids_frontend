import { AcidReactionsResult, AcidReaction } from "./types";

// Mock-коллекция услуг (реакций) — содержимое карточек берётся только отсюда,
// без обращения к бэкенду (л.р. №5)
export const ACID_REACTIONS_MOCK: AcidReactionsResult = {
  count: 8,
  results: [
    {
      id: 1,
      reaction_name: "Взаимодействие с мелом",
      acid_name: "Соляная кислота",
      acid_formula: "HCl",
      molar_mass: 36.46,
      concentration: 10,
      calcium_carbonate_mass: 5.0,
      description:
        "При взаимодействии соляной кислоты с карбонатом кальция выделяется углекислый газ.",
      status: "проверено",
      image_url: "/DefaultImage.png",
      video_url: "",
      likes: 128,
      created_at: "2025-09-01T10:00:00Z",
    },
    {
      id: 2,
      reaction_name: "Оксид серы",
      acid_name: "Серная кислота",
      acid_formula: "H2SO4",
      molar_mass: 98.08,
      concentration: 95,
      calcium_carbonate_mass: 0,
      description:
        "Концентрированная серная кислота обугливает сахар и бумаги за счёт водоотнимающих свойств.",
      status: "проверено",
      image_url: "",
      video_url: "",
      likes: 256,
      created_at: "2025-09-03T12:30:00Z",
    },
    {
      id: 3,
      reaction_name: "Реакция с цинком",
      acid_name: "Азотная кислота",
      acid_formula: "HNO3",
      molar_mass: 63.01,
      concentration: 60,
      calcium_carbonate_mass: 0,
      description:
        "Разбавленная азотная кислота реагирует с активными металлами с выделением водорода.",
      status: "на проверке",
      image_url: "",
      video_url: "",
      likes: 42,
      created_at: "2025-09-05T09:15:00Z",
    },
    {
      id: 4,
      reaction_name: "Сине-фиолетовый индикатор",
      acid_name: "Уксусная кислота",
      acid_formula: "CH3COOH",
      molar_mass: 60.05,
      concentration: 9,
      calcium_carbonate_mass: 0,
      description:
        "Столовый уксус меняет окраску индикатора и разъедает накипь в чайнике.",
      status: "проверено",
      image_url: "",
      video_url: "",
      likes: 88,
      created_at: "2025-09-07T18:45:00Z",
    },
    {
      id: 5,
      reaction_name: "Медная монета",
      acid_name: "Лимонная кислота",
      acid_formula: "C6H8O7",
      molar_mass: 192.12,
      concentration: 5,
      calcium_carbonate_mass: 0,
      description:
        "Раствор лимонной кислоты очищает окисленную медную поверхность до блеска.",
      status: "черновик",
      image_url: "",
      video_url: "",
      likes: 15,
      created_at: "2025-09-10T14:20:00Z",
    },
    {
      id: 6,
      reaction_name: "Пасмурный осадок",
      acid_name: "Серная кислота",
      acid_formula: "H2SO4",
      molar_mass: 98.08,
      concentration: 30,
      calcium_carbonate_mass: 2.5,
      description:
        "При смешивании раствора серной кислоты с хлоридом бария выпадает белый осадок BaSO4.",
      status: "проверено",
      image_url: "",
      video_url: "",
      likes: 73,
      created_at: "2025-09-12T11:05:00Z",
    },
    {
      id: 7,
      reaction_name: "Омыление жира",
      acid_name: "Муравьиная кислота",
      acid_formula: "HCOOH",
      molar_mass: 46.03,
      concentration: 3,
      calcium_carbonate_mass: 0,
      description:
        "Муравьиная кислота содержится в крапиве и вызывает ощущение жжения при контакте с кожей.",
      status: "на проверке",
      image_url: "",
      video_url: "",
      likes: 31,
      created_at: "2025-09-15T16:40:00Z",
    },
    {
      id: 8,
      reaction_name: "Оранжевый всплеск",
      acid_name: "Фосфорная кислота",
      acid_formula: "H3PO4",
      molar_mass: 97.99,
      concentration: 85,
      calcium_carbonate_mass: 0,
      description:
        "Фосфорная кислота входит в состав кока-колы и придаёт напитку кисловатый вкус.",
      status: "проверено",
      image_url: "",
      video_url: "",
      likes: 199,
      created_at: "2025-09-18T08:30:00Z",
    },
  ],
};

// Уникальный список кислот для фильтра по теме (acid_name)
export const getAcidNames = (): string[] => {
  const names = ACID_REACTIONS_MOCK.results.map(
    (item: AcidReaction) => item.acid_name
  );
  return Array.from(new Set(names));
};

// Имитация запроса к API из mock-объекта
export const getAcidReactions = async (): Promise<AcidReactionsResult> => {
  return new Promise((resolve) =>
    setTimeout(() => resolve(ACID_REACTIONS_MOCK), 300)
  );
};
