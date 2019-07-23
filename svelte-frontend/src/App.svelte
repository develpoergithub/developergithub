<script>
  import Account from "./Account.svelte";
  import ApplloClient from "apollo-boost";
  import { setClient } from "svelte-apollo";
  const client = new ApplloClient({ uri: "http://localhost:8000/graphql" });
  setClient(client);
</script>

<style>
  h1 {
    color: purple;
  }
</style>

<main>
  <h1>SWAP BOARD</h1>
  <Account />
</main>
