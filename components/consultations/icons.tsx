"use client";

/* Same client-boundary pattern as components/auth/icons.tsx — @fluentui/react-icons
 * evaluates Griffel styles at module scope and cannot run on the server. Named
 * by role so the icon set can be swapped in one file. */

export {
  Calendar16Regular as CalendarIcon,
  Clock16Regular as ClockIcon,
  Person16Regular as PersonIcon,
  Notepad16Regular as ReasonIcon,
  Dismiss16Regular as CloseIcon,
  Warning20Filled as WarningIcon,
  SpinnerIos16Regular as SpinnerIcon,
} from "@fluentui/react-icons";
