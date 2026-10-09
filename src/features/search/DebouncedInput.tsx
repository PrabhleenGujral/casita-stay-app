// import type { InputHTMLAttributes } from "react";
// import { useEffect, useState } from "react";
// import { useDebouncedCallback } from "../../hooks/useDebouncedCallback";

// //debounce ms
// const DEBOUNCE_MS = 350;

// interface DebouncedInputProps
//   extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
//   value: string;
//   onCommit: (value: string) => void;
// }

// export function DebouncedInput({
//   value,
//   onCommit,
//   ...props
// }: DebouncedInputProps) {
//   const [draft, setDraft] = useState(value);
//   const [lastSyncedValue, setLastSyncedValue] = useState(value);
//   const commit = useDebouncedCallback(onCommit, DEBOUNCE_MS);

//   // The outside value changed, so replace whatever is in the draft.
//   if (value !== lastSyncedValue) {
//     setLastSyncedValue(value);
//     setDraft(value);
//   }
//   useEffect(() => commit.cancel, [value, commit]);

//   const handleChange = (newValue: string) => {
//     setDraft(newValue);
//     commit(newValue);
//   };

//   return (
//     <input
//       {...props}
//       value={draft}
//       onChange={(event) => handleChange(event.target.value)}
//     />
//   );
// }

import type { InputHTMLAttributes } from "react";
import { useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "../../hooks/useDebouncedCallback";

const DEBOUNCE_MS = 350;

interface DebouncedInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string;
  onCommit: (value: string) => void;
}

export function DebouncedInput({
  value,
  onCommit,
  ...props
}: DebouncedInputProps) {
  const [draft, setDraft] = useState(value);
  const lastSyncedRef = useRef(value);
  const commit = useDebouncedCallback(onCommit, DEBOUNCE_MS);

  // Sync external value to draft only when it actually changes from upstream
  useEffect(() => {
    if (value !== lastSyncedRef.current) {
      lastSyncedRef.current = value;
      setDraft(value);
    }
  }, [value]);

  // Cancel debounced commit on unmount or when commit changes
  useEffect(() => {
    return () => commit.cancel();
  }, [commit]);

  const handleChange = (newValue: string) => {
    setDraft(newValue);
    commit(newValue);
  };

  return (
    <input
      {...props}
      value={draft}
      onChange={(e) => handleChange(e.target.value)}
    />
  );
}
