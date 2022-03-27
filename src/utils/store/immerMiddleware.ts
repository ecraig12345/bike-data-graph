import produce from 'immer';
import type { State, StateCreator } from 'zustand';

// https://medium.com/plumguide/a-look-into-react-state-management-in-2021-5fc46a247e65
export default function immerMiddleware<TState extends State>(
  conf: StateCreator<TState>
): StateCreator<TState> {
  return (set, get, api) => {
    // Overwrite the `set` function with the `produce` method from Immer
    return conf(
      (partial, replace) => {
        // type inference isn't working and would probably be hard to fix, so just cast to any
        const nextState = typeof partial === 'function' ? produce(partial as any) : partial;
        return set(nextState as any, replace);
      },
      get,
      api
    );
  };
}
