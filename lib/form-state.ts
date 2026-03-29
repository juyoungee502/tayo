export type ActionState = {
  success?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
  redirectTo?: string;
};

export const INITIAL_ACTION_STATE: ActionState = {};
