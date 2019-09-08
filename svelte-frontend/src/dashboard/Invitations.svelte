<script>
  import { onMount } from "svelte";
  import { getClient, query } from "svelte-apollo";
  import { GET_INVITATIONS } from "../queries.js";
  import Invitation from "./Invitation.svelte";
  import { invitations } from "../store.js";

  const client = getClient();

  const getInvitations = query(client, {
    query: GET_INVITATIONS
  });

  async function fetchInvitations() {
    try {
      await getInvitations.refetch().then(result => {
        invitations.set(result.data.invitations);
        // console.log($invitations);
      });
    } catch (error) {
      // console.log(error);
    }
  }

  onMount(() => {
    fetchInvitations();
  });
</script>

<style>
  main {
    display: flex;
    justify-content: center;
  }
</style>

<main>
  <div>
    {#if $invitations.length > 0}
      {#each $invitations as invite}
        <Invitation invitation={invite} />
      {/each}
    {:else}
      <h6>
        No new Invitation(s), please request an invite from your company's
        admin!
      </h6>
    {/if}
  </div>
</main>
