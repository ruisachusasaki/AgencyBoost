import { Fragment } from "react";

const URL_REGEX = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g;

export function linkifyString(text: string): (string | JSX.Element)[] {
  const parts = text.split(URL_REGEX);
  return parts.map((part, i) => {
    if (URL_REGEX.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80 break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function LinkifyText({ text }: { text: string }) {
  return <span>{linkifyString(text)}</span>;
}
