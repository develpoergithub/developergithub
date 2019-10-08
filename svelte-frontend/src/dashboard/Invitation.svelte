<script>
  import { fade } from "svelte/transition";
  import { getClient, mutate } from "svelte-apollo";
  import { CONFIRM_INVITATION } from "../queries.js";
  import { invitations } from "../store.js";
  import { notifications } from "../Noto.svelte";
  import { formatDate } from "timeUtils";

  export let invitation;
  const client = getClient();
  let dateFormat = "#{l}, #{F} #{j}, #{Y} at #{H}:#{i}";

  async function confirmInvitation() {
    try {
      await mutate(client, {
        mutation: CONFIRM_INVITATION,
        variables: { invitationId: invitation.id }
      }).then(result => {
        var invite = result.data.confirmUserConnection.userConnection;
        var foundIndex = $invitations.findIndex(x => x.id === invite.id);
        $invitations[foundIndex] = invite;
        notifications.success(
          "Congratulations! You have successfully joined " +
            invite.company.userprofile.companyName,
          4000
        );
      });
    } catch (error) {
      console.log(error);
      notifications.danger("Something went wrong, please try again!");
    }
  }
</script>

<style>
  main {
    display: flex;
    justify-content: center;
    width: 25rem;
    height: 15rem;
    padding-top: 2rem;
  }
</style>

<main in:fade={{ transition: 500 }}>
  <div class="card">
    <div class="card-header">
      Invitation sent on {formatDate(new Date(invitation.created), dateFormat)}
    </div>
    <div class="card-body">
      <h5 class="card-title">
        From {invitation.company.userprofile.companyName}
      </h5>
      <p class="card-text">
        Please accept invitation to post and swap shifts with your colleagues.
      </p>
      {#if invitation.isConfirmed}
        <h5>You have already accepted this invitation!</h5>
      {:else}
        <button class="btn btn-primary" on:click={confirmInvitation}>
          Accept
        </button>
      {/if}
      <!-- <a href="#" class="btn btn-primary">Decline</a> -->
    </div>
  </div>
</main>
