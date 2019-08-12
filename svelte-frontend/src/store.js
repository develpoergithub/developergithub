import { writable } from "svelte/store";

export const isLoggedIn = writable(false);
export const keepMeLoggedIn = writable(false);
export const lastLoggedIn = writable(Number);
export const refreshToken = writable("");
export const user = writable({});
