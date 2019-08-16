<script context="module">
  export let notification;
</script>

<script>
  import { onMount, afterUpdate, beforeUpdate, setContext } from "svelte";
  import Router, { push, pop, replace } from "svelte-spa-router";
  import { routes } from "./Routes.svelte";
  import Header from "./Header.svelte";
  import ApolloClient from "apollo-boost";
  import { setClient, getClient, query, mutate } from "svelte-apollo";
  import {
    keepMeLoggedIn,
    isLoggedIn,
    lastLoggedIn,
    refreshToken
  } from "./store.js";
  import { useLocalStorage, useSessionStorage } from "./storage.js";
  import { REFRESH_TOKEN } from "./queries.js";
  import {
    tokenRefreshTimeoutFunc,
    clearTokenRefreshTimeout
  } from "./authMethods.js";
  import Noto, { notifications } from "./Noto.svelte";

  const client = new ApolloClient({
    uri: "https://swapboard.herokuapp.com/graphql"
  });

  setClient(client);

  useSessionStorage(isLoggedIn, "isLoggedIn");
  useLocalStorage(keepMeLoggedIn, "keepMeLoggedIn");
  useLocalStorage(refreshToken, "refreshToken");
  useLocalStorage(lastLoggedIn, "lastLoggedIn");

  window.addEventListener("storage", function(event) {
    if (event.key == "login-event") {
      setTimeout(() => {
        isLoggedIn.set(true);
      }, Math.random() * (2000 - 1000) + 1000);
      // localStorage.removeItem("login-event");
    } else if (event.key == "logout-event") {
      sessionStorage.setItem("startedTimeoutSession", JSON.stringify(false));
      isLoggedIn.set(false);
      // localStorage.removeItem("logout-event");
    } else if (event.key == "new-tab-event") {
      if ($isLoggedIn === true) {
        localStorage.setItem(
          "currently-logged-in-event",
          "true" + Math.random()
        );
        // localStorage.removeItem("new-tab-event");
      }
    } else if (event.key == "currently-logged-in-event") {
      isLoggedIn.set(true);
      // localStorage.removeItem("currently-logged-in-event");
    } else if (event.key == "start-timeout-event") {
      setTimeout(() => {
        tokenRefreshTimeoutFunc(client);
      }, Math.random() * (10000 - 5000) + 5000);
    }
  });

  window.addEventListener("beforeunload", function(event) {
    if (sessionStorage.getItem("startedTimeoutSession") === null) {
      return;
    }

    if (JSON.parse(sessionStorage.getItem("startedTimeoutSession")) === true) {
      sessionStorage.setItem("startedTimeoutSession", JSON.stringify(false));
      localStorage.setItem("startedTimeout", JSON.stringify(false));
      localStorage.setItem("start-timeout-event", "timeout" + Math.random());
    }
  });

  onMount(() => {
    if ($keepMeLoggedIn === true && $isLoggedIn === false) {
      isLoggedIn.set(true);
    } else {
      localStorage.setItem("new-tab-event", "newtab" + Math.random());
    }
  });

  $: if ($isLoggedIn === true) {
    tokenRefreshTimeoutFunc(client);
    push("/dashboard/");
  } else {
    clearTokenRefreshTimeout();
    push("/login");
  }
</script>

<style>

</style>

<main>
  <Noto />
  <Header />
  <Router {routes} />
</main>
