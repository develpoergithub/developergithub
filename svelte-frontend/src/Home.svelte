<script>
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { push, pop, replace } from "svelte-spa-router";
  import { isLoggedIn } from "./store.js";
  import { setClient, getClient, query, mutate } from "svelte-apollo";
  import { REFRESH_TOKEN } from "./queries.js";
  import { refreshToken } from "./store.js";

  if ($isLoggedIn === false) {
    push("/login");
  } else {
    push("/dashboard/");
  }

  const client = getClient();

  onMount(() => {
    if ($refreshToken !== "") {
      tokenRefresh();
    } else {
      push("/login");
    }
  });

  async function tokenRefresh() {
    try {
      await mutate(client, {
        mutation: REFRESH_TOKEN,
        variables: { $refreshToken }
      }).then(result => {
        refreshToken.set(result.data.refreshToken.refreshToken);
        isLoggedIn.set(true);
        //push("/dashboard/");
      });
    } catch (error) {
      console.log(error);
      push("/login");
    }
  }
</script>

<style>
  h1 {
    text-align: center;
  }
</style>

<div in:fade={{ duration: 500 }}>
  <h1>Home Page</h1>
</div>
