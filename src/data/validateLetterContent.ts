import type {
  EligibleActivity,
  LetterContent,
  LetterVoiceKind
} from "../types";

const EXPECTED_LETTERS = [
  ["A", "А"],
  ["B", "Б"],
  ["V", "В"],
  ["G", "Г"],
  ["D", "Д"],
  ["E", "Е"],
  ["Yo", "Ё"],
  ["Zh", "Ж"],
  ["Z", "З"],
  ["I", "И"],
  ["J", "Й"],
  ["K", "К"],
  ["L", "Л"],
  ["M", "М"],
  ["N", "Н"],
  ["O", "О"],
  ["P", "П"],
  ["R", "Р"],
  ["S", "С"],
  ["T", "Т"],
  ["U", "У"],
  ["F", "Ф"],
  ["Kh", "Х"],
  ["Ts", "Ц"],
  ["Ch", "Ч"],
  ["Sh", "Ш"],
  ["Shch", "Щ"],
  ["Hard", "Ъ"],
  ["Yery", "Ы"],
  ["Soft", "Ь"],
  ["Eh", "Э"],
  ["Yu", "Ю"],
  ["Ya", "Я"]
] as const;

const ACTIVITIES = new Set<EligibleActivity>(["learn", "find", "picture", "listen"]);
const PICTURE_TARGET_BLOCKED_IDS = new Set(["Hard", "Soft"]);
const VOICE_KINDS: LetterVoiceKind[] = [
  "letter",
  "find",
  "picture",
  "correct",
  "listen",
  "reward"
];

export interface LetterContentValidationOptions {
  pathExists?: (path: string) => boolean;
}

function validatePath(
  errors: string[],
  letterId: string,
  field: string,
  path: string,
  kind: "image" | "audio",
  pathExists?: (path: string) => boolean
): void {
  const prefixOk =
    kind === "image"
      ? path.startsWith("/assets/")
      : path.startsWith("/audio/") || path.startsWith("/assets/audio/");
  const extension = kind === "image" ? /\.(?:webp|png|svg)$/ : /\.(?:mp3|wav)$/;

  if (
    !prefixOk ||
    path.includes("\\") ||
    path.includes("..") ||
    path.startsWith("/Game/") ||
    !extension.test(path)
  ) {
    errors.push(`${letterId}.${field}: invalid ${kind} path "${path}"`);
    return;
  }
  if (pathExists && !pathExists(path)) {
    errors.push(`${letterId}.${field}: file does not exist with exact case "${path}"`);
  }
}

export function validateLetterContent(
  letters: readonly LetterContent[],
  options: LetterContentValidationOptions = {}
): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const pictureExampleIds = new Map<string, string>();
  const picturePaths = new Map<string, string>();

  if (letters.length !== EXPECTED_LETTERS.length) {
    errors.push(`letters: expected ${EXPECTED_LETTERS.length} entries, received ${letters.length}`);
  }

  letters.forEach((letter, index) => {
    const expected = EXPECTED_LETTERS[index];
    if (!/^[A-Z][A-Za-z]*$/.test(letter.id)) {
      errors.push(`${letter.id || `index-${index}`}.id: invalid letter id`);
    }
    if (ids.has(letter.id)) {
      errors.push(`${letter.id}.id: duplicate letter id`);
    }
    ids.add(letter.id);

    if (expected && (letter.id !== expected[0] || letter.upper !== expected[1])) {
      errors.push(
        `${letter.id}.order: expected ${expected[0]}/${expected[1]} at index ${index}`
      );
    }
    if ([...letter.upper].length !== 1 || [...letter.lower].length !== 1) {
      errors.push(`${letter.id}.glyph: upper and lower must each contain one character`);
    }
    if (letter.lower !== letter.upper.toLocaleLowerCase("ru-RU")) {
      errors.push(`${letter.id}.lower: does not match lowercase of ${letter.upper}`);
    }
    if (!Number.isInteger(letter.group) || letter.group < 0) {
      errors.push(`${letter.id}.group: must be a non-negative integer`);
    }
    if (!Number.isFinite(letter.difficulty) || letter.difficulty <= 0) {
      errors.push(`${letter.id}.difficulty: must be a positive number`);
    }

    const eligible = letter.eligibleActivities ?? [];
    const seenActivities = new Set<string>();
    eligible.forEach((activity) => {
      if (!ACTIVITIES.has(activity)) {
        errors.push(`${letter.id}.eligibleActivities: invalid activity "${activity}"`);
      }
      if (seenActivities.has(activity)) {
        errors.push(`${letter.id}.eligibleActivities: duplicate activity "${activity}"`);
      }
      seenActivities.add(activity);
    });

    Object.entries(letter.images ?? {}).forEach(([field, path]) => {
      if (path) {
        validatePath(errors, letter.id, `images.${field}`, path, "image", options.pathExists);
      }
    });
    (letter.pictureExamples ?? []).forEach((example, exampleIndex) => {
      const field = `${letter.id}.pictureExamples[${exampleIndex}]`;
      if (!example.id.trim() || !/^[A-Za-z][A-Za-z0-9-]*$/.test(example.id)) {
        errors.push(`${field}.id: stable id is required`);
      } else {
        const existing = pictureExampleIds.get(example.id);
        if (existing) {
          errors.push(`${field}.id: duplicates picture example used by ${existing}`);
        } else {
          pictureExampleIds.set(example.id, field);
        }
      }
      if (!example.word.trim()) {
        errors.push(`${field}.word: non-empty word is required`);
      }
      if (!example.image.trim()) {
        errors.push(`${field}.image: image is required`);
      } else {
        validatePath(
          errors,
          letter.id,
          `pictureExamples[${exampleIndex}].image`,
          example.image,
          "image",
          options.pathExists
        );
        const existing = picturePaths.get(example.image);
        if (existing) {
          errors.push(`${field}.image: duplicates picture image used by ${existing}`);
        } else {
          picturePaths.set(example.image, field);
        }
      }

      const flags = [
        example.pictureEligible,
        example.allowedAsTarget,
        example.allowedAsDistractor
      ];
      if (flags.some((flag) => typeof flag !== "boolean")) {
        errors.push(`${field}: eligibility flags must be explicit booleans`);
      }
      if (
        !example.pictureEligible &&
        (example.allowedAsTarget || example.allowedAsDistractor)
      ) {
        errors.push(`${field}: ineligible example cannot be target or distractor`);
      }
      if (
        example.pictureEligible &&
        !example.allowedAsTarget &&
        !example.allowedAsDistractor
      ) {
        errors.push(`${field}: eligible example must allow target or distractor use`);
      }
      if (example.allowedAsTarget) {
        const initial = [...example.word.trim().toLocaleUpperCase("ru-RU")][0] ?? "";
        if (!eligible.includes("picture")) {
          errors.push(`${field}: target requires letter picture eligibility`);
        }
        if (initial !== letter.upper) {
          errors.push(`${field}.word: target word must start with ${letter.upper}`);
        }
        if (PICTURE_TARGET_BLOCKED_IDS.has(letter.id)) {
          errors.push(`${field}: ${letter.upper} cannot be a Picture target`);
        }
      }
    });

    if (letter.word.trim()) {
      const examples = letter.pictureExamples ?? [];
      const learnMatch = examples.find((example) => example.word === letter.word);
      if (learnMatch) {
        validatePath(
          errors,
          letter.id,
          "learnExample.image",
          learnMatch.image,
          "image",
          options.pathExists
        );
      }
    }

    (letter.specialExamples ?? []).forEach((example, exampleIndex) => {
      const field = `specialExamples[${exampleIndex}]`;
      if (!example.word.trim()) {
        errors.push(`${letter.id}.${field}.word: non-empty word is required`);
      }
      if (!example.image.trim()) {
        errors.push(`${letter.id}.${field}.image: image is required`);
      } else {
        validatePath(
          errors,
          letter.id,
          `${field}.image`,
          example.image,
          "image",
          options.pathExists
        );
      }
    });

    Object.entries(letter.audio ?? {}).forEach(([kind, clip]) => {
      if (!clip) {
        return;
      }
      if (!VOICE_KINDS.includes(kind as LetterVoiceKind)) {
        errors.push(`${letter.id}.audio: invalid voice kind "${kind}"`);
        return;
      }
      const expectedKey = `${kind}-${letter.id.toLowerCase()}`;
      if (clip.key !== expectedKey) {
        errors.push(`${letter.id}.audio.${kind}: expected key "${expectedKey}"`);
      }
      validatePath(
        errors,
        letter.id,
        `audio.${kind}.path`,
        clip.path,
        "audio",
        options.pathExists
      );
    });

    if (!letter.contentReady) {
      return;
    }

    if (!letter.images?.object && !letter.images?.findObject && !letter.images?.picture) {
      errors.push(`${letter.id}.images: object or picture image required for contentReady letter`);
    }

    (["learn", "find", "listen"] as const).forEach((activity) => {
      if (!eligible.includes(activity)) {
        errors.push(`${letter.id}.eligibleActivities: missing "${activity}"`);
      }
    });
    if (PICTURE_TARGET_BLOCKED_IDS.has(letter.id) || letter.id === "Yery") {
      if (eligible.includes("picture")) {
        errors.push(`${letter.id}.eligibleActivities: must not include picture`);
      }
    } else if (!eligible.includes("picture")) {
      errors.push(`${letter.id}.eligibleActivities: missing "picture"`);
    }
    if (
      eligible.includes("picture") &&
      !letter.pictureExamples?.some(
        (example) => example.pictureEligible && example.allowedAsTarget
      )
    ) {
      errors.push(`${letter.id}.pictureExamples: target example required for Picture`);
    }
    const requiredVoice: LetterVoiceKind[] = eligible.includes("picture")
      ? VOICE_KINDS
      : VOICE_KINDS.filter((kind) => kind !== "picture");
    requiredVoice.forEach((kind) => {
      if (!letter.audio?.[kind]) {
        errors.push(`${letter.id}.audio.${kind}: required for contentReady letter`);
      }
    });
    if (!letter.pronunciation) {
      errors.push(`${letter.id}.pronunciation: required for contentReady letter`);
    }
  });

  if (!letters.some((letter) => letter.contentReady)) {
    errors.push("letters: at least one contentReady letter is required");
  }

  return errors;
}
