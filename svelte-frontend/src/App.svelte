<script>
  import Router from "svelte-spa-router";
  import { routes } from "./Routes.svelte";
  import Header from "./Header.svelte";
  import ApplloClient from "apollo-boost";
  import { setClient } from "svelte-apollo";

  const client = new ApplloClient({
    uri: "https://localhost:8000/graphql"
  });
  setClient(client);
</script>

<style>

</style>

<main>
  <Header />
  <Router {routes} />
</main>
