<script>
  import { fade } from "svelte/transition";
  import Router from "svelte-spa-router";
  import { push, pop, replace } from "svelte-spa-router";
  import { routes } from "../DashBoardRoutes.svelte";
  import { isLoggedIn, user } from "../store.js";
  import { getClient, query, mutate } from "svelte-apollo";
  import { GET_USER } from "../queries.js";
  import { onMount } from "svelte";

  const client = getClient();

  const getUser = query(client, {
    query: GET_USER
  });

  async function fetchUser() {
    try {
      await getUser.refetch().then(result => {
        user.set(result.data.me);
      });
    } catch (error) {
      console.log(error);
    }
  }

  onMount(async () => {
    fetchUser();
  });
</script>

<style>
  p {
    text-align: center;
  }
  div {
    display: flex;
    justify-content: center;
  }
</style>

<div in:fade={{ duration: 500 }}>
  <p>This is a work in progress check back later!</p>
</div>
<Router {routes} />
