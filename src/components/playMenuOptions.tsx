import { ReactNode } from "react";
import { LetterCategory, PlayActivity, StudyOrder } from "../types";
import { ASSETS, assetUrl } from "../utils/assets";
import { HomeChoiceTone } from "./HomePanel";

export function IconBook() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 6.2c4.4 1.1 7.6 1.8 13 1.8v18.4c-5.6-.2-9-1.1-13-2.2V6.2z"
      />
      <path
        fill="#fff"
        opacity=".45"
        d="M5.2 8.1c3.8.9 6.8 1.4 10.8 1.4v15.4c-4.4-.2-7.4-.9-10.8-1.8V8.1z"
      />
      <path
        fill="currentColor"
        d="M29 6.2c-4.4 1.1-7.6 1.8-13 1.8v18.4c5.6-.2 9-1.1 13-2.2V6.2z"
      />
      <path
        fill="#fff"
        opacity=".7"
        d="M26.8 8.1c-3.8.9-6.8 1.4-10.8 1.4v15.4c4.4-.2 7.4-.9 10.8-1.8V8.1z"
      />
      <path d="M16 8v18.4" stroke="currentColor" strokeWidth="1.8" fill="none" />
    </svg>
  );
}

export function IconSearch() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="14" cy="14" r="8" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M20 20l8 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function IconQuestion() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <text
        x="16"
        y="25"
        textAnchor="middle"
        fontSize="26"
        fontWeight="900"
        fill="currentColor"
      >
        ?
      </text>
    </svg>
  );
}

export function IconSound() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path fill="currentColor" d="M4 12h7l8-7v22l-8-7H4z" />
      <path
        d="M23 11c2 2 2 8 0 10M27 8c4 4 4 12 0 16"
        stroke="currentColor"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconAbc() {
  return (
    <svg viewBox="0 0 40 24" aria-hidden="true">
      <rect x="1" y="4" width="12" height="16" rx="3" fill="#ff6b7a" />
      <rect x="14" y="4" width="12" height="16" rx="3" fill="#ffb703" />
      <rect x="27" y="4" width="12" height="16" rx="3" fill="#4fc3ff" />
      <text x="7" y="16" textAnchor="middle" fontSize="10" fontWeight="900" fill="#fff">
        А
      </text>
      <text x="20" y="16" textAnchor="middle" fontSize="10" fontWeight="900" fill="#fff">
        Б
      </text>
      <text x="33" y="16" textAnchor="middle" fontSize="10" fontWeight="900" fill="#fff">
        В
      </text>
    </svg>
  );
}

export function IconShuffle() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path
        d="M6 10h8l8 12h6M6 22h8l3-4M22 10h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M24 6l6 4-6 4M24 18l6 4-6 4" fill="currentColor" />
    </svg>
  );
}

export function IconHand() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path
        fill="currentColor"
        d="M13.8 1.4c1.55 0 2.7 1.2 2.7 2.8v11.2c.35-.05.7-.08 1.05-.08.9 0 1.55.5 1.85 1.2.45-.2.95-.3 1.5-.3 1.25 0 2.2.85 2.45 1.95.4-.15.85-.22 1.3-.22 1.5 0 2.65 1.15 2.65 2.7V23c0 4.05-3.15 7.2-7.55 7.2h-4.05C10.2 30.2 6.7 26.5 6.7 21.6v-7.15c0-1.5 1.2-2.7 2.7-2.7s2.7 1.2 2.7 2.7v1.55h1.7V4.2c0-1.6 1.15-2.8 2.7-2.8z"
      />
    </svg>
  );
}

export function IconNotes() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path fill="currentColor" d="M12 6h12v4H16v12a5 5 0 1 1-4-4.9V6z" />
      <circle cx="10" cy="23" r="4" fill="currentColor" />
    </svg>
  );
}

export function IconCube() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path fill="#ffb703" d="M16 4l12 7v10L16 28 4 21V11z" />
      <path fill="#fff" opacity=".35" d="M16 4l12 7-12 7L4 11z" />
    </svg>
  );
}

export const activityVisuals = {
  learn: ASSETS.ui.learnButton
} as const;

export const studyOrderVisuals = {
  manual: ASSETS.ui.selectLetterButton
} as const;

export const ACTIVITY_OPTIONS: Array<{
  value: PlayActivity;
  label: string;
  tone: HomeChoiceTone;
  icon?: ReactNode;
  image?: string;
}> = [
  {
    value: "learn",
    label: "1. Знакомство с буквой",
    tone: "blue",
    icon: <IconBook />,
    image: activityVisuals.learn
  },
  { value: "find", label: "2. Найди букву", tone: "purple", icon: <IconSearch /> },
  { value: "picture", label: "3. Что начинается на букву", tone: "orange", icon: <IconQuestion /> },
  { value: "listen", label: "4. Послушай и выбери картинку", tone: "pink", icon: <IconSound /> }
];

export const ORDER_OPTIONS: Array<{
  value: StudyOrder;
  label: string;
  tone: HomeChoiceTone;
  icon?: ReactNode;
  image?: string;
}> = [
  { value: "alpha", label: "В алфавитном порядке", tone: "blue", icon: <IconAbc /> },
  { value: "random", label: "Рандомно", tone: "purple", icon: <IconShuffle /> },
  {
    value: "pick",
    label: "Выбери букву",
    tone: "green",
    image: studyOrderVisuals.manual,
    icon: (
      <img
        className="home-choice__icon-img"
        src={assetUrl(studyOrderVisuals.manual)}
        alt=""
        draggable={false}
      />
    )
  }
];

export const CATEGORY_OPTIONS: Array<{
  value: LetterCategory;
  label: string;
  tone: HomeChoiceTone;
  icon: ReactNode;
}> = [
  { value: "all", label: "Все буквы", tone: "blue", icon: <IconAbc /> },
  { value: "vowels", label: "Гласные", tone: "pink", icon: <IconNotes /> },
  { value: "consonants", label: "Согласные", tone: "orange", icon: <IconCube /> }
];

export const activityIcons = {
  learn: activityVisuals.learn,
  find: IconSearch,
  picture: IconQuestion,
  listen: IconSound
} as const;

export const studyOrderIcons = {
  alphabetical: IconAbc,
  random: IconShuffle,
  manual: studyOrderVisuals.manual
} as const;

export const categoryIcons = {
  all: IconAbc,
  vowels: IconNotes,
  consonants: IconCube
} as const;
