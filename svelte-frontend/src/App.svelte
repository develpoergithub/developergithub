<script context="module">
  export let notification;
</script>

<script>
  import { onMount, afterUpdate, beforeUpdate, setContext } from "svelte";
  import Router, { push, pop, replace, location } from "svelte-spa-router";
  import { routes } from "./Routes.svelte";
  import Header from "./Header.svelte";
  import { ApolloClient } from "apollo-client";
  import { InMemoryCache } from "apollo-cache-inmemory";
  import { HttpLink } from "apollo-link-http";
  import { WebSocketLink } from "apollo-link-ws";
  import { getMainDefinition } from "apollo-utilities";
  import { onError } from "apollo-link-error";
  import { split } from "apollo-link";
  import { SubscriptionClient } from "subscriptions-transport-ws";
  import { setClient, getClient, query, mutate } from "svelte-apollo";
  import {
    keepMeLoggedIn,
    isLoggedIn,
    lastLoggedIn,
    refreshToken,
    user,
    selectedCompany,
    shifts,
    myShifts,
    menuDisplayed
  } from "./store.js";
  import { useLocalStorage, useSessionStorage } from "./storage.js";
  import {
    checkSession,
    fetchUser,
    fetchConnections,
    fetchShifts,
    fetchShiftConnections,
    tokenRefreshTimeoutFunc,
    clearTokenRefreshTimeout
  } from "./authMethods.js";
  import Noto, { notifications } from "./Noto.svelte";
  import Table from "./table_view/Table.svelte";

  let selectedCompanyId = "";

  const HTTP_GRAPHQL_ENDPOINT =
    (window.location.protocol.includes("https") ? "https" : "http") +
    "://" +
    window.location.host +
    "/graphql";

  const WS_GRAPHQL_ENDPOINT =
    (window.location.protocol.includes("https") ? "wss" : "ws") +
    "://" +
    window.location.host +
    "/graphql";

  // console.log("PROTOCOL HTTP : " + HTTP_GRAPHQL_ENDPOINT);
  // console.log("PROTOCOL WS : " + WS_GRAPHQL_ENDPOINT);

  const httpLink = new HttpLink({
    uri: HTTP_GRAPHQL_ENDPOINT
    // credentials: 'same-origin'
  });

  const wsLink = new WebSocketLink({
    uri: WS_GRAPHQL_ENDPOINT,
    options: {
      reconnect: true
    }
  });

  const link = split(
    ({ query }) => {
      const { kind, operation } = getMainDefinition(query);
      return kind === "OperationDefinition" && operation === "subscription";
    },
    wsLink,
    httpLink
  );

  const client = new ApolloClient({
    link,
    cache: new InMemoryCache()
  });

  setClient(client);

  useSessionStorage(isLoggedIn, "isLoggedIn");
  useLocalStorage(keepMeLoggedIn, "keepMeLoggedIn");
  useLocalStorage(refreshToken, "refreshToken");
  useLocalStorage(lastLoggedIn, "lastLoggedIn");
  // useLocalStorage(user, "user");

  window.addEventListener("storage", function(event) {
    if (event.key === "login-event") {
      if (!$isLoggedIn) {
        setTimeout(() => {
          isLoggedIn.set(true);
        }, Math.random() * (1000 - 500) + 500);
      }
    } else if (event.key === "logout-event") {
      isLoggedIn.set(false);
      sessionStorage.setItem("startedTimeoutSession", JSON.stringify(false));
    } else if (event.key === "start-timeout-event") {
      setTimeout(() => {
        tokenRefreshTimeoutFunc(client);
      }, Math.random() * (10000 - 5000) + 5000);
    } else if (event.key === "new-tab-event") {
      if ($isLoggedIn) {
        localStorage.setItem("login-event", "login" + Math.random());
      }
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

  // if ($keepMeLoggedIn === true && $isLoggedIn === false) {
  //   isLoggedIn.set(true);
  //   menuDisplayed.set(true);
  //   tokenRefreshTimeoutFunc(client);
  //   fetchUser(client);
  //   fetchConnections(client);
  // } else if ($isLoggedIn === true) {
  //   menuDisplayed.set(true);
  //   tokenRefreshTimeoutFunc(client);
  //   fetchUser(client);
  //   fetchConnections(client);
  // } else {
  //   localStorage.setItem("new-tab-event", "newtab" + Math.random());
  // }

  $: if ($isLoggedIn === false) {
    loggedOutFunc();
  } else {
    loggedInFunc();
  }

  async function loggedInFunc() {
    // console.log("loggedIn, pushing to /dashboard");
    push("/dashboard");
    menuDisplayed.set(true);
    await tokenRefreshTimeoutFunc(client);
    await fetchUser(client);
    await fetchConnections(client);
    if ($user.isCompany) {
      selectedCompanyId = $user.id;
      getShifts();
    }
  }

  async function loggedOutFunc() {
    menuDisplayed.set(false);
    clearTokenRefreshTimeout();
    push("/login");
    console.log("loggedOut, pushing to /login");
  }

  $: if (window.screen.availWidth < 640) {
    menuDisplayed.set(false);
  }

  onMount(async () => {
    if ($isLoggedIn) {
      console.log("Already Logged In");
      return;
    }

    if ($keepMeLoggedIn) {
      console.log("Keep Me Logged In is True");
      isLoggedIn.set(true);
      return;
    }

    localStorage.setItem("new-tab-event", "newTab" + Math.random());

    // CHECK USER IF USER IS IN SESSION
    // await checkSession(client);
  });

  $: if ($selectedCompany) {
    selectedCompanyId = $selectedCompany.id;
    getShifts();
  }

  async function getShifts() {
    if (selectedCompanyId) {
      await fetchShifts(client, selectedCompanyId);
      $myShifts = $shifts.filter(shift => shift.postedBy.id === $user.id);
      await fetchShiftConnections(client, selectedCompanyId);
    }
  }
</script>

<style>
  #wrapper {
    margin-top: 55px;
  }
  /* Sidebar */
  #sidebar-wrapper {
    z-index: 1;
    position: fixed;
    width: 0px;
    height: 100%;
    overflow-y: hidden;
    background: grey;
    opacity: 0.9;
  }

  /* Always take up entire screen */
  #page-content-wrapper {
    width: 100%;
    position: absolute;
    padding: 15px;
  }

  /* Change with of sidebar from 0 to 250px */
  #wrapper.menuDisplayed #sidebar-wrapper {
    width: 250px;
  }

  /* Since we added left padding, we need to shrink the width by 250px */
  #wrapper.menuDisplayed #page-content-wrapper {
    padding-left: 260px;
  }

  /* Sidebar styling - the entire ul list */
  .sidebar-nav {
    padding: 0;
    list-style: none;
  }

  .sidebar-nav li {
    text-indent: 20px;
    line-height: 40px;
  }

  .sidebar-nav li a {
    display: block;
    text-decoration: none;
    color: #ddd;
  }

  .sidebar-nav li a:hover {
    background: #16a085;
  }

  @media screen and (max-width: 640px) {
    #wrapper.menuDisplayed #sidebar-wrapper {
      display: none;
    }

    #wrapper.menuDisplayed #page-content-wrapper {
      padding-left: 0px;
    }
  }
</style>

<main>
  <Header />
  <div id="wrapper" class={$menuDisplayed ? 'menuDisplayed' : ''}>

    <div id="sidebar-wrapper" class="">

      <ul class="sidebar-nav">
        {#if !$user.isCompany}
          <li>
            <a href="#/dashboard/postshift">Post Shift</a>
          </li>
        {/if}
        <li>
          <a href="#/dashboard/shifts">Shift</a>
        </li>
        {#if !$user.isCompany}
          <li>
            <a href="#/dashboard/myshifts">My Shift</a>
          </li>
        {/if}
        <li>
          {#if $user.isCompany}
            <a href="#/dashboard/invite">Invite</a>
          {:else}
            <a href="#/dashboard/invitations">Invitations</a>
          {/if}
        </li>
      </ul>
    </div>
    <div id="page-content-wrapper">
      <Noto />

      <Router {routes} />
    </div>
  </div>
</main>
