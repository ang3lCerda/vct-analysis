const EVENT_NAMES: Record<string, string> = {
  '2760': 'VCT Masters Santiago 2026',
}

export function getEventName(eventId: string): string {
  return EVENT_NAMES[eventId] ?? `Event ${eventId}`
}
