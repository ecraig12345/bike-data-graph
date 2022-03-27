export default function applyUpdates<T extends {}>(
  current: T,
  updates: Partial<T>,
  allowUndefined?: boolean
) {
  for (const [k, v] of Object.entries(updates)) {
    if (v !== undefined || allowUndefined) {
      (current as any)[k] = v;
    }
  }
}
