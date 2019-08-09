import App from "./App.svelte";

const app = new App({
  target: document.body,
  props: {
    notifications: null
  }
});

export default app;
