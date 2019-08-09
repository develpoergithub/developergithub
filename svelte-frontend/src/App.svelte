<script>
  import { onMount } from "svelte";
  import Router, { push, pop, replace } from "svelte-spa-router";
  import { routes } from "./Routes.svelte";
  import Header from "./Header.svelte";
  import ApplloClient from "apollo-boost";
  import { setClient, getClient, query, mutate } from "svelte-apollo";
  import { isLoggedIn, refreshToken } from "./store.js";
  import useLocalStorage from "./useLocalStorage.js";

  const client = new ApplloClient({
    uri: "http://localhost:8000/graphql"
  });

  setClient(client);

  //useLocalStorage(isLoggedIn, "isLoggedIn");
  useLocalStorage(refreshToken, "refreshToken");

  onMount(() => {});

  $: if ($isLoggedIn == true) {
    //console.log($user.email + " is logged in = " + $isLoggedIn);
    push("/dashboard/");
  } else {
    //console.log($user.email + " is logged in = " + $isLoggedIn);
    push("/login");
  }
</script>

<style>

</style>

<main>
  <Header />
  <Router {routes} />
</main>
