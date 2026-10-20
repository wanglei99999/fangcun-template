// Adapted from Fuwari (MIT License, https://github.com/saicaca/fuwari).
import { toString } from 'mdast-util-to-string';
import getReadingTime from 'reading-time';

// reading-time counts each CJK character as a word; ~300 characters per minute suits Chinese text.
const WORDS_PER_MINUTE = 300;

export function remarkReadingTime() {
  return (tree, { data }) => {
    const readingTime = getReadingTime(toString(tree), { wordsPerMinute: WORDS_PER_MINUTE });
    data.astro.frontmatter.minutes = Math.max(1, Math.round(readingTime.minutes));
    data.astro.frontmatter.words = readingTime.words;
  };
}
