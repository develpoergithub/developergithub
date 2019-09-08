<script>
  import { notifications } from "./Noto.svelte";
  import { isLoggedIn, user } from "./store.js";
  import { getClient, mutate } from "svelte-apollo";
  import { CONFIRM_INVITATION } from "./queries.js";
  import AuthRoute from "./AuthRoute.svelte";
  import { push } from "svelte-spa-router";

  export let params = {};

  const client = getClient();

  let label = "Confirming invitation, please wait...";

  setTimeout(() => {
    if ($isLoggedIn === false) {
      push("/login");
    } else {
      confirmInvitation();
    }
  }, 5000);

  async function confirmInvitation() {
    try {
      await mutate(client, {
        mutation: CONFIRM_INVITATION,
        variables: { invitationId: params.id }
      }).then(result => {
        label = "Congratulation, invitation confirmed!";
        let msg =
          "You have successfully joined " +
          result.data.confirmUserConnection.userConnection.company.userprofile
            .companyName;
        if (result.data.confirmUserConnection.userConnection.isConfirmed) {
          notifications.success(msg);
        }
        setTimeout(() => {
          push("/dashboard/");
        }, 3500);
      });
    } catch (error) {
      console.log(error);
      push("/dashboard/");
    }
  }
  console.log(params.id);
</script>

<style>
  /* your styles go here */
</style>

<!-- <AuthRoute /> -->
<main>
  <div class="card">
    <p>{label}</p>
  </div>
</main>
