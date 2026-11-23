import { toast } from "sonner";

/** Messages shown at the bottom of the page. */
export type Notify = { success: (message: string) => void; error: (message: string) => void };

// Every message goes through here, so no component calls sonner directly. There's one user and no
// sign-in, so nothing needs checking before a message shows.
const notify: Notify = {
  success: (message) => toast.success(message),
  error: (message) => toast.error(message),
};

export function useNotify(): Notify {
  return notify;
}
