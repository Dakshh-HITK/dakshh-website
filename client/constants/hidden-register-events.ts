export const HIDDEN_REGISTER_EVENT_NAMES = [
  "Model Forge",
  "Skeld Sprint",
  "Hack Among Us",
] as const;

export function isHiddenRegisterEvent(eventName: string): boolean {
  return (HIDDEN_REGISTER_EVENT_NAMES as readonly string[]).includes(
    eventName,
  );
}
