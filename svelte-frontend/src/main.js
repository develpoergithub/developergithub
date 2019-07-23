import App from "./App.svelte";

const app = new App({
  target: document.body,
  props: {
    name: "Martins"
  }
});

export default app;
